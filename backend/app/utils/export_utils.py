import pandas as pd
from io import BytesIO
from typing import Dict, Any
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.patches as patches

class ExportUtils:
    def export_to_excel(self, timetable_data: Dict[str, Any]) -> bytes:
        """Export timetable to Excel format"""
        timetable = timetable_data.get('timetable', {})
        
        # Create a structured DataFrame
        all_time_slots = set()
        for day in timetable.values():
            all_time_slots.update(day.keys())
        
        time_slots = sorted(list(all_time_slots))
        
        # Create DataFrame
        df_data = {}
        for day in timetable.keys():
            day_schedule = []
            for time_slot in time_slots:
                slot_info = timetable[day].get(time_slot)
                if slot_info:
                    display_text = f"{slot_info['course_code']}\n{slot_info['teacher']}\n{slot_info['room']}"
                else:
                    display_text = "-"
                day_schedule.append(display_text)
            df_data[day] = day_schedule
        
        df = pd.DataFrame(df_data, index=time_slots)
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Write timetable
            df.to_excel(writer, sheet_name='Timetable')
            
            # Write summary
            summary = timetable_data.get('summary', {})
            if summary:
                summary_data = []
                
                # Course completion
                for course_code, completion in summary.get('courses_completion', {}).items():
                    summary_data.append({
                        'Course Code': course_code,
                        'Scheduled': completion['scheduled'],
                        'Required': completion['required'],
                        'Completion Rate': f"{completion['completion_rate']:.1f}%"
                    })
                
                if summary_data:
                    summary_df = pd.DataFrame(summary_data)
                    summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        output.seek(0)
        return output.getvalue()
    
    def export_to_pdf(self, timetable_data: Dict[str, Any]) -> bytes:
        """Export timetable to PDF format"""
        timetable = timetable_data.get('timetable', {})
        
        output = BytesIO()
        
        with PdfPages(output) as pdf:
            # Create figure
            fig, ax = plt.subplots(figsize=(16, 10))
            ax.set_xlim(0, 10)
            ax.set_ylim(0, 8)
            ax.set_title("Institution Timetable", fontsize=20, fontweight='bold', pad=20)
            
            # Get all time slots
            all_time_slots = set()
            for day in timetable.values():
                all_time_slots.update(day.keys())
            
            time_slots = sorted(list(all_time_slots))
            days = list(timetable.keys())
            
            # Calculate cell dimensions
            cell_width = 8 / len(days) if days else 1
            cell_height = 6 / len(time_slots) if time_slots else 1
            
            # Draw grid and fill with data
            for i, day in enumerate(days):
                for j, time_slot in enumerate(time_slots):
                    x = 1 + i * cell_width
                    y = 6 - j * cell_height
                    
                    # Draw cell border
                    rect = patches.Rectangle((x, y), cell_width, cell_height, 
                                           linewidth=1, edgecolor='black', facecolor='lightgray')
                    ax.add_patch(rect)
                    
                    # Add day header
                    if j == 0:
                        ax.text(x + cell_width/2, y + cell_height + 0.2, day, 
                               ha='center', va='center', fontweight='bold', fontsize=10)
                    
                    # Add time slot label
                    if i == 0:
                        ax.text(x - 0.1, y + cell_height/2, time_slot, 
                               ha='right', va='center', fontweight='bold', fontsize=8)
                    
                    # Add course information
                    slot_info = timetable[day].get(time_slot)
                    if slot_info:
                        course_text = f"{slot_info['course_code']}\n{slot_info['teacher']}\n{slot_info['room']}"
                        ax.text(x + cell_width/2, y + cell_height/2, course_text, 
                               ha='center', va='center', fontsize=8, fontweight='bold')
                        
                        # Color code by course type
                        if slot_info['type'].lower() == 'lab':
                            rect.set_facecolor('lightblue')
                        else:
                            rect.set_facecolor('lightgreen')
            
            # Remove axes
            ax.set_xticks([])
            ax.set_yticks([])
            ax.spines['top'].set_visible(False)
            ax.spines['right'].set_visible(False)
            ax.spines['bottom'].set_visible(False)
            ax.spines['left'].set_visible(False)
            
            pdf.savefig(fig, bbox_inches='tight')
            plt.close()
        
        output.seek(0)
        return output.getvalue()
