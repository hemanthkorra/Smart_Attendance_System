from flask import Flask, request, jsonify
import pyodbc
import numpy as np
import io
import face_recognition
import base64
import cv2
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

# ✅ SQL Server connection string
conn_str = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=HEMANTH\\SQLEXPRESS;"
    "Database=SmartAttandanceDb;"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"  # Optional for SSL warning
)

# ✅ Serialize numpy array to byte stream for DB
def serialize_encoding(encoding):
    """Serializes a NumPy array (face encoding) to bytes."""
    memfile = io.BytesIO()
    np.save(memfile, encoding)
    memfile.seek(0)
    return memfile.read()

# ✅ Deserialize byte stream from DB back to numpy array
def deserialize_encoding(binary_data):
    """Deserializes bytes back into a NumPy array (face encoding)."""
    memfile = io.BytesIO(binary_data)
    memfile.seek(0)
    return np.load(memfile)

# ✅ Extract face encoding from base64 image bytes
def get_face_encoding_from_image(image_bytes):
    """
    Decodes image bytes and extracts the first face encoding.
    Requires cv2 to be imported at the top level.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        logging.error("Failed to decode image bytes into an OpenCV image.")
        return None

    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) # Convert BGR (OpenCV default) to RGB (face_recognition expects)
    
    # Try to detect faces
    face_locations = face_recognition.face_locations(rgb_img)

    logging.info(f"Detected face locations: {face_locations}")

    if not face_locations:
        logging.info("No face detected in the provided image.")
        return None

    # Get encoding for the first detected face
    encodings = face_recognition.face_encodings(rgb_img, face_locations)
    
    if not encodings:
        logging.info("No face encoding generated for the detected face.")
        return None

    return encodings[0]

@app.route('/save-face-encoding', methods=['POST'])
def save_face_encoding():
    logging.info("Received request to /save-face-encoding")
    try:
        data = request.get_json()
        employee_id = data.get('employeeId')
        image_base64 = data.get('imageBase64')

        # ✅ Validate input
        if not employee_id or not image_base64:
            logging.warning("Missing employeeId or imageBase64 in request for save-face-encoding.")
            return jsonify({"error": "employeeId and imageBase64 are required"}), 400

        # ✅ Remove prefix if exists: "data:image/jpeg;base64,..."
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        img_bytes = base64.b64decode(image_base64)
        logging.info(f"Image bytes decoded for save. Size: {len(img_bytes)} bytes.")

        # ✅ Get face encoding
        encoding = get_face_encoding_from_image(img_bytes)
        if encoding is None:
            logging.warning("Could not get face encoding (no face detected or decoding issue) for save.")
            return jsonify({"error": "No face detected in image"}), 400

        serialized_encoding = serialize_encoding(encoding)
        logging.info(f"Face encoding serialized for save. Size: {len(serialized_encoding)} bytes.")

        # ✅ Insert into DB
        with pyodbc.connect(conn_str) as conn:
            cursor = conn.cursor()
            logging.info(f"Attempting to save encoding for EmployeeId: {employee_id}")
            # Ensure table name matches your actual SQL table name (e.g., UserFaceEncoding)
            cursor.execute(
                "INSERT INTO UserFaceEncoding (EmployeeId, FaceEncoding) VALUES (?, ?)",
                employee_id, serialized_encoding
            )
            conn.commit()
            logging.info(f"Face encoding for EmployeeId {employee_id} saved successfully.")

        return jsonify({"message": "Face encoding saved successfully"}), 200

    except pyodbc.Error as db_err:
        logging.error(f"Database error occurred during save-face-encoding: {db_err}")
        logging.error(traceback.format_exc()) # Log the full traceback
        return jsonify({"error": f"Database error: {str(db_err)}"}), 500
    except Exception as e:
        logging.error(f"An unexpected error occurred during save-face-encoding: {e}")
        logging.error(traceback.format_exc()) # Log the full traceback
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

@app.route('/recognize-face', methods=['POST'])
def recognize_face():
    logging.info("Received request to /recognize-face")
    try:
        data = request.get_json()
        image_base64 = data.get('imageBase64')

        if not image_base64:
            logging.warning("Missing imageBase64 in request for recognize-face.")
            return jsonify({"error": "imageBase64 is required"}), 400

        # Remove prefix if exists: "data:image/jpeg;base64,..."
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        img_bytes = base64.b64decode(image_base64)
        logging.info(f"Image bytes decoded for recognition. Size: {len(img_bytes)} bytes.")

        # Get encoding from the incoming image
        unknown_face_encoding = get_face_encoding_from_image(img_bytes)
        if unknown_face_encoding is None:
            logging.warning("No face detected in the incoming image for recognition.")
            return jsonify({"error": "No face detected in the provided image"}), 400

        known_face_encodings = []
        known_employee_ids = []

        # Fetch all stored encodings from the database
        with pyodbc.connect(conn_str) as conn:
            cursor = conn.cursor()
            # Ensure table name matches your actual SQL table name (e.g., UserFaceEncoding)
            cursor.execute("SELECT EmployeeId, FaceEncoding FROM UserFaceEncoding")
            rows = cursor.fetchall()
            logging.info(f"Fetched {len(rows)} stored encodings from DB.")

            for row in rows:
                employee_id = row.EmployeeId
                face_encoding_bytes = row.FaceEncoding
                try:
                    # Deserialize and add to our known lists
                    known_face_encodings.append(deserialize_encoding(face_encoding_bytes))
                    known_employee_ids.append(employee_id)
                except Exception as e:
                    logging.error(f"Error deserializing encoding for EmployeeId {employee_id}: {e}")
                    # Continue to next encoding if one fails to deserialize

        if not known_face_encodings:
            logging.info("No face encodings found in the database to compare against.")
            return jsonify({"message": "No registered faces found in the system."}), 200

        # Compare the unknown face to all known faces
        # tolerance: Lower values mean stricter match. 0.6 is a common default.
        matches = face_recognition.compare_faces(known_face_encodings, unknown_face_encoding, tolerance=0.6)
        
        # Calculate face distances to find the best match (lowest distance)
        face_distances = face_recognition.face_distance(known_face_encodings, unknown_face_encoding)
        
        best_match_index = -1
        min_distance = float('inf')

        for i, (is_match, distance) in enumerate(zip(matches, face_distances)):
            if is_match: # Only consider actual matches
                if distance < min_distance:
                    min_distance = distance
                    best_match_index = i

        if best_match_index != -1:
            recognized_employee_id = known_employee_ids[best_match_index]
            logging.info(f"Face recognized! EmployeeId: {recognized_employee_id} with distance {min_distance:.2f}")
            return jsonify({
                "message": "Face recognized successfully",
                "employeeId": recognized_employee_id,
                "distance": round(min_distance, 2)
            }), 200
        else:
            logging.info("No matching face found.")
            return jsonify({"message": "No matching face found"}), 200

    except pyodbc.Error as db_err:
        logging.error(f"Database error occurred during recognize-face: {db_err}")
        logging.error(traceback.format_exc())
        return jsonify({"error": f"Database error: {str(db_err)}"}), 500
    except Exception as e:
        logging.error(f"An unexpected error occurred during recognize-face: {e}")
        logging.error(traceback.format_exc())
        return jsonify({"error": f"An internal server error occurred: {str(e)}"}), 500

# ✅ Run Flask app
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=6000, debug=True) # debug=True for development