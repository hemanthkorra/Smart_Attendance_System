import { Component, ViewChild } from '@angular/core';
import { AttendanceRecord } from '../interfaces/interfaces';
import { AdminService } from '../../Services/admin-service.service';
import { CommonModule, DatePipe } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import {
    ApexNonAxisChartSeries,
    ApexResponsive,
    ApexChart,
    ChartComponent
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any; // Can be string[]
  title: ApexTitleSubtitle;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
};


@Component({
  selector: 'app-view-all-attendance',
  imports: [DatePipe, CommonModule, NgApexchartsModule],
  templateUrl: './view-all-attendance.component.html',
  styleUrl: './view-all-attendance.component.css'
})
export class ViewAllAttendanceComponent {
 attendanceRecords: AttendanceRecord[] = [];
  errorMessage: string | null = null;
  isLoading: boolean = true; // Added isLoading flag for spinner

  // Reference to the ApexCharts component in the template
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>; // Using Partial as not all properties are initialized at once

  constructor(private adminService: AdminService) {
    // Initialize chartOptions with default configuration for a donut chart
    this.chartOptions = {
      series: [], // Initial empty series
      chart: {
        width: 380, // Chart width
        type: "donut" // Chart type
      },
      labels: [], // Initial empty labels
      responsive: [ // Responsive options for different screen sizes
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200 // Smaller width on small screens
            },
            legend: {
              position: "bottom" // Move legend to bottom on small screens
            }
          }
        }
      ],
      // Adding plotOptions for donut labels (as per your previous component's chart config)
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                formatter: function (w) {
                  // Sum all series values for the total
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString();
                }
              }
            }
          }
        }
      }
    };
  }

  ngOnInit(): void {
    // Load attendance records when the component initializes
    this.loadAttendanceRecords();
  }

  /**
   * Loads all attendance records from the admin service and updates the chart data.
   */
  loadAttendanceRecords(): void {
    this.isLoading = true; // Set loading to true when starting fetch
    this.errorMessage = null; // Clear any previous error messages

    // Assuming adminService has a method to get all attendance records.
    // If your service method is actually `getAllAttendance()`, please adjust this line.
    this.adminService.getAllAttendance().subscribe({
      next: (data: AttendanceRecord[]) => {
        this.attendanceRecords = data; // Assign fetched data
        this.isLoading = false; // Set loading to false on success
        this.updateChartData(); // Process data for the chart
      },
      error: (err) => {
        // Handle errors during data fetching
        console.error('Failed to load attendance records:', err);
        this.errorMessage = 'Failed to load attendance records. Please try again.';
        this.attendanceRecords = []; // Clear records on error
        this.isLoading = false; // Set loading to false on error
        this.updateChartData(); // Update chart to reflect no data (e.g., show 'No Data' in chart)
      }
    });
  }

  /**
   * Processes the attendance records to calculate statistics for the chart.
   * Counts occurrences of 'Present', 'HalfDay', and 'Leave' statuses.
   */
  private updateChartData(): void {
    let presentCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;

    // Iterate through records to count statuses
    this.attendanceRecords.forEach(record => {
      switch (record.status) {
        case 'Present':
          presentCount++;
          break;
        case 'HalfDay': // Matches 'bg-info text-dark' in HTML
          halfDayCount++;
          break;
        case 'Leave': // Matches 'bg-danger' in HTML
          leaveCount++;
          break;
        // Extend with more cases if other attendance statuses exist
      }
    });

    // Update the chart options with the calculated series data and labels
    // Only update if there's actual data to show in the chart
    if (presentCount > 0 || halfDayCount > 0 || leaveCount > 0) {
      this.chartOptions = {
        ...this.chartOptions, // Preserve other chart configurations
        series: [presentCount, halfDayCount, leaveCount],
        labels: ['Present', 'Half Day', 'Leave']
      };
    } else {
      // If no data, set series to empty or zeros and labels to 'No Data'
      this.chartOptions = {
        ...this.chartOptions,
        series: [], // Empty series
        labels: []  // Empty labels
      };
    }
  }
}
