import { Component, ViewChild } from '@angular/core';
import { AttendanceReport } from '../interfaces/interfaces';

import {ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTitleSubtitle,
  ApexPlotOptions,
  ApexDataLabels,
  ApexFill,
  ApexLegend,
  ApexResponsive,
  NgApexchartsModule} from 'ng-apexcharts';
import { UserService } from '../../Services/user-service.service';
import { AuthService } from '../../Services/auth-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
export type ChartOptions = {
  series: ApexAxisChartSeries | number[]; // Allow number[] for pie charts
  chart: ApexChart;
  xaxis?: ApexXAxis;
  title: ApexTitleSubtitle;
  plotOptions: ApexPlotOptions;
  dataLabels?: ApexDataLabels;
  fill?: ApexFill;
  legend: ApexLegend;
  responsive: ApexResponsive[];
  labels?: string[];
  colors?: string[];
};

@Component({
  selector: 'app-attendance-report-component',
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './attendance-report-component.component.html',
  styleUrl: './attendance-report-component.component.css'
})
export class AttendanceReportComponentComponent {
@ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> | undefined;

  userId: number | null = null;
  attendanceReport: AttendanceReport | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // Injected ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Check if a userId is provided in the route parameters (for admin view)
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam; // Convert string to number
      } else {
        // Fallback to current logged-in user if no ID in route params
        this.userId = this.authService.getCurrentUserId();
      }

      if (this.userId === null) {
        this.errorMessage = 'User not logged in or no user ID provided. Please log in or select a user.';
        this.isLoading = false;
        // Only navigate to login if it's not an admin trying to view a specific user
        // and there's no logged-in user.
        if (!idParam) { // If no ID param, it means a regular user path, so redirect to login
          this.router.navigate(['/login']);
        }
        return;
      }

      this.fetchAttendanceReport(this.userId);
    });
  }

  fetchAttendanceReport(userId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getAttendanceReport(userId).subscribe({
      next: (report: AttendanceReport) => {
        this.attendanceReport = report;
        this.isLoading = false;
        this.initializeChart(report); // Initialize chart with fetched data
        if (report.records.length === 0) {
          this.errorMessage = 'No attendance records found for this user.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching attendance report:', err);
        if (err.status === 404) {
          this.errorMessage = 'User not found or no attendance report available.';
        } else {
          this.errorMessage = 'Failed to load attendance report. Please try again.';
        }
      }
    });
  }

  private initializeChart(report: AttendanceReport): void {
    if (!report || report.totalDays === 0) {
        this.chartOptions = undefined; // Clear chart options if no data
        return;
    }

    const rawSeriesData = [
        report.presentDays,
        report.halfDays,
        report.leaveDays
    ];

    const rawLabels = ['Present Days', 'Half Days', 'Leave Days'];

    // Filter out series with zero values and their corresponding labels
    // This makes the chart cleaner and prevents rendering issues with zero slices
    const filteredSeriesData: number[] = [];
    const filteredLabels: string[] = [];
    const filteredColors: string[] = []; // If you have custom colors, filter them too

    // Define colors if you want specific ones for each label,
    // otherwise ApexCharts assigns default colors.
    // Ensure these match your legend colors (blue, green, orange in your screenshot)
    const predefinedColors = ['#007bff', '#28a745', '#ffc107']; // Blue, Green, Orange (Bootstrap primary, success, warning)


    rawSeriesData.forEach((dataValue, index) => {
        if (dataValue > 0) { // Only include if the value is greater than zero
            filteredSeriesData.push(dataValue);
            filteredLabels.push(rawLabels[index]);
            filteredColors.push(predefinedColors[index]); // Add corresponding color
        }
    });

    // If after filtering, no data is left, don't show the chart
    if (filteredSeriesData.length === 0) {
        this.chartOptions = undefined;
        return;
    }

    this.chartOptions = {
        series: filteredSeriesData, // CORRECTED: Pass directly as number[]
        chart: {
            type: "pie",
            height: 380, // Increased height slightly for more room
            toolbar: {
                show: false // Hide toolbar for a cleaner look
            },
            animations: {
                enabled: true
            },
            // Adjusted to prevent overlap with title
            offsetY: 0, // Adjust this value to move the pie chart down
            offsetX: 0, // Center the chart horizontally
            // Add a small margin to the top of the chart drawing area
            // This can help push the chart down from the title if needed
            // offsetY: 20 // Adjust this value if still overlapping after other changes
        },
        labels: filteredLabels, // Use filtered labels
        colors: filteredColors, // Assign filtered colors
        responsive: [
            {
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: "bottom"
                    }
                }
            }
        ],
        legend: {
            position: 'bottom',
            fontSize: '14px',
            markers: {
                // 'size' property removed as it is not supported by ApexCharts
            },
            itemMargin: {
                horizontal: 10,
                vertical: 5
            }
        },
        plotOptions: {
            pie: {
                offsetY: 0, // Adjust this value to move the pie chart down
                donut: {
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Days',
                            formatter: function (w: any) {
                                return w.globals.totalSum.toString();
                            },
                            fontSize: '20px', // Adjust font size for total
                            fontWeight: 'bold',
                            color: '#343a40'
                        },
                        value: {
                            formatter: function (val: string) {
                                return val + " days";
                            },
                            fontSize: '16px', // Adjust font size for value
                            fontWeight: 'normal',
                            color: '#555'
                        }
                    }
                }
            }
        }
    };
  }

  // Helper for displaying record status
  getStatusClass(status: string): string {
    switch (status) {
      case 'Present': return 'badge bg-success';
      case 'HalfDay': return 'badge bg-warning text-dark';
      case 'Leave': return 'badge bg-info';
      default: return 'badge bg-secondary';
    }
  }
}

