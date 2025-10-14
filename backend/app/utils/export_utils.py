import io
import pandas as pd
from datetime import datetime
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import pytz

class ExportUtils:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
    def export_to_excel(self, timetable_data: Dict[str, Any]) -> bytes:
        """Export timetable to Excel format"""
        try:
            # Create Excel writer
            output = io.BytesIO()
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                # Extract timetable data
                timetable = timetable_data.get('timetable', {})
                summary = timetable_data.get('summary', {})
                fitness_score = timetable_data.get('fitness_score', 0)
                
                # Create main timetable sheet
                self._create_timetable_sheet(timetable, writer)
                
                # Create summary sheet
                self._create_summary_sheet(summary, fitness_score, writer)
                
                # Create teacher workload sheet
                self._create_teacher_workload_sheet(timetable, writer)
                
                # Create room utilization sheet
                self._create_room_utilization_sheet(timetable, writer)
            
            output.seek(0)
            return output.getvalue()
            
        except Exception as e:
            print(f"Excel export error: {e}")
            raise Exception(f"Failed to generate Excel file: {str(e)}")
    
    def _create_timetable_sheet(self, timetable: Dict, writer):
        """Create main timetable sheet"""
        # Get all time slots and days
        time_slots = set()
        days = []
        
        for day, schedule in timetable.items():
            days.append(day)
            for time_slot in schedule.keys():
                time_slots.add(time_slot)
        
        # Sort time slots
        sorted_time_slots = sorted(list(time_slots), key=lambda x: tuple(map(int, x.split(':'))))
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        sorted_days = sorted(days, key=lambda x: day_order.index(x) if x in day_order else 999)
        
        # Create DataFrame
        data = []
        for time_slot in sorted_time_slots:
            row = {'Time': time_slot}
            for day in sorted_days:
                class_info = timetable.get(day, {}).get(time_slot)
                if class_info:
                    cell_text = f"{class_info.get('course_code', 'N/A')}\n{class_info.get('teacher', 'N/A')}\n{class_info.get('room', 'N/A')}"
                    if class_info.get('type') == 'lab':
                        cell_text += f"\n[LAB]"
                else:
                    cell_text = "Free"
                row[day] = cell_text
            data.append(row)
        
        df = pd.DataFrame(data)
        df.to_excel(writer, sheet_name='Timetable', index=False)
        
        # Format the sheet
        worksheet = writer.sheets['Timetable']
        
        # Set column widths
        worksheet.column_dimensions['A'].width = 12
        for col in sorted_days:
            col_letter = chr(ord('A') + sorted_days.index(col) + 1)
            worksheet.column_dimensions[col_letter].width = 20
        
        # Set row heights
        for row in range(2, len(sorted_time_slots) + 2):
            worksheet.row_dimensions[row].height = 60
    
    def _create_summary_sheet(self, summary: Dict, fitness_score: float, writer):
        """Create summary statistics sheet"""
        ist_timezone = pytz.timezone('Asia/Kolkata')
        current_time = datetime.now(ist_timezone)
        
        summary_data = [
            ['Metric', 'Value'],
            ['Generated At', current_time.strftime('%Y-%m-%d %H:%M:%S IST')],
            ['Fitness Score', f"{fitness_score:.2f}"],
            ['Total Classes', summary.get('total_classes_scheduled', 0)],
            ['Courses Completion Rate', f"{len(summary.get('courses_completion', {}))}/"],
        ]
        
        # Add course completion details
        courses_completion = summary.get('courses_completion', {})
        for course, details in courses_completion.items():
            completion_rate = details.get('completion_rate', 0)
            scheduled = details.get('scheduled', 0)
            required = details.get('required', 0)
            summary_data.append([f"Course {course}", f"{scheduled}/{required} ({completion_rate:.1f}%)"])
        
        df_summary = pd.DataFrame(summary_data[1:], columns=summary_data[0])
        df_summary.to_excel(writer, sheet_name='Summary', index=False)
    
    def _create_teacher_workload_sheet(self, timetable: Dict, writer):
        """Create teacher workload analysis sheet"""
        teacher_workload = {}
        
        for day, schedule in timetable.items():
            for time_slot, class_info in schedule.items():
                if class_info:
                    teacher = class_info.get('teacher', 'Unknown')
                    if teacher not in teacher_workload:
                        teacher_workload[teacher] = {'total_hours': 0, 'days': set(), 'courses': set()}
                    
                    teacher_workload[teacher]['total_hours'] += 1
                    teacher_workload[teacher]['days'].add(day)
                    teacher_workload[teacher]['courses'].add(class_info.get('course_code', 'Unknown'))
        
        # Convert to DataFrame
        workload_data = []
        for teacher, data in teacher_workload.items():
            workload_data.append([
                teacher,
                data['total_hours'],
                len(data['days']),
                len(data['courses']),
                ', '.join(sorted(data['courses']))
            ])
        
        df_workload = pd.DataFrame(workload_data, columns=[
            'Teacher', 'Total Hours/Week', 'Days Teaching', 'Courses Count', 'Courses'
        ])
        df_workload.to_excel(writer, sheet_name='Teacher Workload', index=False)
    
    def _create_room_utilization_sheet(self, timetable: Dict, writer):
        """Create room utilization analysis sheet"""
        room_usage = {}
        
        for day, schedule in timetable.items():
            for time_slot, class_info in schedule.items():
                if class_info:
                    room = class_info.get('room', 'Unknown')
                    if room not in room_usage:
                        room_usage[room] = {'usage_count': 0, 'days': set(), 'time_slots': set()}
                    
                    room_usage[room]['usage_count'] += 1
                    room_usage[room]['days'].add(day)
                    room_usage[room]['time_slots'].add(time_slot)
        
        # Convert to DataFrame
        room_data = []
        for room, data in room_usage.items():
            room_data.append([
                room,
                data['usage_count'],
                len(data['days']),
                len(data['time_slots']),
                f"{data['usage_count']/35*100:.1f}%" if data['usage_count'] > 0 else "0%"  # Assuming 35 total slots per week
            ])
        
        df_rooms = pd.DataFrame(room_data, columns=[
            'Room', 'Total Usage', 'Days Used', 'Time Slots Used', 'Utilization %'
        ])
        df_rooms.to_excel(writer, sheet_name='Room Utilization', index=False)
    
    def export_to_pdf(self, timetable_data: Dict[str, Any]) -> bytes:
        """Export timetable to PDF format"""
        try:
            output = io.BytesIO()
            doc = SimpleDocTemplate(output, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
            story = []
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=self.styles['Heading1'],
                fontSize=18,
                textColor=colors.darkblue,
                alignment=TA_CENTER,
                spaceAfter=20
            )
            
            story.append(Paragraph("Weekly Timetable", title_style))
            
            # Generation info
            ist_timezone = pytz.timezone('Asia/Kolkata')
            current_time = datetime.now(ist_timezone)
            info_style = ParagraphStyle(
                'Info',
                parent=self.styles['Normal'],
                fontSize=10,
                alignment=TA_CENTER,
                spaceAfter=20
            )
            
            fitness_score = timetable_data.get('fitness_score', 0)
            story.append(Paragraph(f"Generated on: {current_time.strftime('%Y-%m-%d %H:%M:%S IST')} | Fitness Score: {fitness_score:.2f}", info_style))
            story.append(Spacer(1, 20))
            
            # Create timetable table
            timetable = timetable_data.get('timetable', {})
            table_data = self._create_pdf_table_data(timetable)
            
            # Create table
            table = Table(table_data, repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(table)
            
            # Add summary on new page
            story.append(PageBreak())
            story.append(Paragraph("Timetable Summary", title_style))
            
            summary = timetable_data.get('summary', {})
            summary_text = f"""
            <b>Total Classes Scheduled:</b> {summary.get('total_classes_scheduled', 0)}<br/>
            <b>Fitness Score:</b> {fitness_score:.2f}<br/>
            <b>Generation Method:</b> Genetic Algorithm Optimization<br/>
            <b>Optimization Criteria:</b> Conflict-free scheduling with consecutive lab sessions
            """
            
            story.append(Paragraph(summary_text, self.styles['Normal']))
            
            # Build PDF
            doc.build(story)
            output.seek(0)
            return output.getvalue()
            
        except Exception as e:
            print(f"PDF export error: {e}")
            raise Exception(f"Failed to generate PDF file: {str(e)}")
    
    def _create_pdf_table_data(self, timetable: Dict):
        """Create table data for PDF export"""
        # Get all time slots and days
        time_slots = set()
        days = []
        
        for day, schedule in timetable.items():
            days.append(day)
            for time_slot in schedule.keys():
                time_slots.add(time_slot)
        
        # Sort time slots and days
        sorted_time_slots = sorted(list(time_slots), key=lambda x: tuple(map(int, x.split(':'))))
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        sorted_days = sorted(days, key=lambda x: day_order.index(x) if x in day_order else 999)
        
        # Create header
        header = ['Time'] + sorted_days
        table_data = [header]
        
        # Add rows
        for time_slot in sorted_time_slots:
            row = [time_slot]
            for day in sorted_days:
                class_info = timetable.get(day, {}).get(time_slot)
                if class_info:
                    course = class_info.get('course_code', 'N/A')
                    teacher = class_info.get('teacher', 'N/A')
                    room = class_info.get('room', 'N/A')
                    class_type = class_info.get('type', 'lecture')
                    
                    cell_text = f"{course}\n{teacher}\n{room}"
                    if class_type == 'lab':
                        cell_text += "\n[LAB]"
                else:
                    cell_text = "Free"
                row.append(cell_text)
            table_data.append(row)
        
        return table_data
