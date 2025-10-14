import random
import copy
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timedelta

class Course(BaseModel):
    code: str
    name: str
    teacher: str
    lectures_per_week: int
    type: str = "lecture"  # "lecture" or "lab"
    duration: int = 45
    lab_duration: int = 2  # Number of consecutive periods for labs
    
    class Config:
        use_enum_values = True
        
    def model_dump(self):
        """For Pydantic v2 compatibility"""
        return {
            'code': self.code,
            'name': self.name,
            'teacher': self.teacher,
            'lectures_per_week': self.lectures_per_week,
            'type': self.type,
            'duration': self.duration,
            'lab_duration': self.lab_duration
        }
    
    def dict(self):
        """For Pydantic v1 compatibility"""
        return self.model_dump()

class GeneticTimetableOptimizer:
    def __init__(self, courses: List[Course], constraints: Dict[str, Any], resources: Dict[str, int]):
        self.courses = courses
        self.constraints = constraints
        self.resources = resources
        self.population_size = 100
        self.generations = 300
        self.mutation_rate = 0.15
        self.crossover_rate = 0.8
        self.elite_size = int(0.1 * self.population_size)
        
        # Generate time slots
        self.time_slots = self._generate_time_slots()
        self.working_days = constraints.get('working_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
        
    def _generate_time_slots(self):
        """Generate time slots based on constraints"""
        start_time = self.constraints.get('start_time', '09:00')
        end_time = self.constraints.get('end_time', '17:00')
        duration = self.constraints.get('lecture_duration', 45)
        lunch_start = self.constraints.get('lunch_start', '12:30')
        lunch_end = self.constraints.get('lunch_end', '13:30')
        
        # Convert times to minutes
        def time_to_minutes(time_str):
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        
        def minutes_to_time(minutes):
            hours = minutes // 60
            mins = minutes % 60
            return f"{hours:02d}:{mins:02d}"
        
        start_minutes = time_to_minutes(start_time)
        end_minutes = time_to_minutes(end_time)
        lunch_start_minutes = time_to_minutes(lunch_start)
        lunch_end_minutes = time_to_minutes(lunch_end)
        
        slots = []
        current = start_minutes
        
        while current + duration <= end_minutes:
            current_time = minutes_to_time(current)
            
            # Skip lunch time
            if not (lunch_start_minutes <= current < lunch_end_minutes):
                slots.append(current_time)
            
            current += duration
        
        return slots
    
    def _can_place_consecutive_lab(self, timetable, day, start_slot_index, lab_duration, course_info):
        """Check if a lab can be placed in consecutive slots"""
        if start_slot_index + lab_duration > len(self.time_slots):
            return False
        
        # Check if all required consecutive slots are free
        for i in range(lab_duration):
            slot_index = start_slot_index + i
            if slot_index >= len(self.time_slots):
                return False
            
            time_slot = self.time_slots[slot_index]
            if timetable[day][time_slot] is not None:
                return False
        
        # Check for teacher conflicts in these slots
        teacher = course_info.get('teacher', '')
        for i in range(lab_duration):
            slot_index = start_slot_index + i
            time_slot = self.time_slots[slot_index]
            
            # Check if teacher is busy at this time on any day
            for other_day in self.working_days:
                if other_day != day and timetable[other_day][time_slot] is not None:
                    other_class = timetable[other_day][time_slot]
                    if other_class.get('teacher', '') == teacher:
                        return False
        
        return True
    
    def _place_consecutive_lab(self, timetable, day, start_slot_index, lab_duration, course_info):
        """Place a lab in consecutive slots"""
        placed_slots = []
        
        for i in range(lab_duration):
            slot_index = start_slot_index + i
            time_slot = self.time_slots[slot_index]
            
            lab_info = course_info.copy()
            lab_info['session_part'] = f"{i+1}/{lab_duration}"
            lab_info['is_consecutive'] = True
            lab_info['total_duration'] = lab_duration
            
            timetable[day][time_slot] = lab_info
            placed_slots.append(time_slot)
        
        return placed_slots
    
    def create_individual(self):
        """Create a random timetable individual with proper consecutive lab placement"""
        timetable = {}
        
        # Initialize empty timetable
        for day in self.working_days:
            timetable[day] = {}
            for time_slot in self.time_slots:
                timetable[day][time_slot] = None
        
        # Separate courses by type
        regular_courses = []
        lab_courses = []
        
        for course in self.courses:
            for i in range(course.lectures_per_week):
                class_info = {
                    'course_code': course.code,
                    'course_name': course.name,
                    'teacher': course.teacher,
                    'type': course.type,
                    'room': f"{'Lab' if course.type == 'lab' else 'Room'} {random.randint(1, self.resources.get('classrooms', 5))}",
                    'lab_duration': course.lab_duration if course.type == 'lab' else 1
                }
                
                if course.type == 'lab':
                    lab_courses.append(class_info)
                else:
                    regular_courses.append(class_info)
        
        # Place lab courses first (they need consecutive slots)
        for lab_info in lab_courses:
            placed = False
            attempts = 0
            max_attempts = 100
            
            while not placed and attempts < max_attempts:
                day = random.choice(self.working_days)
                start_slot_index = random.randint(0, len(self.time_slots) - lab_info['lab_duration'])
                
                if self._can_place_consecutive_lab(timetable, day, start_slot_index, lab_info['lab_duration'], lab_info):
                    self._place_consecutive_lab(timetable, day, start_slot_index, lab_info['lab_duration'], lab_info)
                    placed = True
                
                attempts += 1
            
            # If still not placed, try to place in any single available slot (fallback)
            if not placed:
                for attempt in range(50):
                    day = random.choice(self.working_days)
                    time_slot = random.choice(self.time_slots)
                    
                    if timetable[day][time_slot] is None:
                        lab_info['session_part'] = "1/1"
                        lab_info['is_consecutive'] = False
                        lab_info['total_duration'] = 1
                        timetable[day][time_slot] = lab_info
                        placed = True
                        break
        
        # Place regular lecture courses
        for lecture_info in regular_courses:
            placed = False
            attempts = 0
            
            while not placed and attempts < 50:
                day = random.choice(self.working_days)
                time_slot = random.choice(self.time_slots)
                
                if timetable[day][time_slot] is None:
                    # Check for teacher conflicts
                    teacher = lecture_info.get('teacher', '')
                    conflict = False
                    
                    for other_day in self.working_days:
                        if other_day != day and timetable[other_day][time_slot] is not None:
                            other_class = timetable[other_day][time_slot]
                            if other_class.get('teacher', '') == teacher:
                                conflict = True
                                break
                    
                    if not conflict:
                        lecture_info['session_part'] = "1/1"
                        lecture_info['is_consecutive'] = False
                        lecture_info['total_duration'] = 1
                        timetable[day][time_slot] = lecture_info
                        placed = True
                
                attempts += 1
        
        return timetable
    
    def calculate_fitness(self, timetable):
        """Calculate fitness score with emphasis on consecutive lab placement"""
        fitness = 1000  # Base fitness
        
        # Check basic constraints
        fitness += self._check_no_conflicts(timetable) * 500
        fitness += self._check_teacher_workload(timetable) * 300
        fitness += self._check_room_utilization(timetable) * 200
        
        # Heavy bonus for proper consecutive lab placement
        fitness += self._check_consecutive_lab_placement(timetable) * 800
        
        # Check course completion
        fitness += self._check_course_completion(timetable) * 600
        
        return max(0, fitness)
    
    def _check_consecutive_lab_placement(self, timetable):
        """Check if labs are properly placed in consecutive slots"""
        score = 0
        
        for day in self.working_days:
            day_schedule = timetable[day]
            
            # Group consecutive lab sessions
            for i, time_slot in enumerate(self.time_slots):
                class_info = day_schedule.get(time_slot)
                
                if class_info and class_info.get('type') == 'lab':
                    is_consecutive = class_info.get('is_consecutive', False)
                    total_duration = class_info.get('total_duration', 1)
                    session_part = class_info.get('session_part', '1/1')
                    
                    if is_consecutive and total_duration > 1:
                        # Check if this is the start of a consecutive lab session
                        if session_part == "1/" + str(total_duration):
                            # Verify all consecutive slots are properly filled
                            consecutive_valid = True
                            course_code = class_info.get('course_code', '')
                            teacher = class_info.get('teacher', '')
                            
                            for j in range(total_duration):
                                if i + j >= len(self.time_slots):
                                    consecutive_valid = False
                                    break
                                
                                check_slot = self.time_slots[i + j]
                                check_class = day_schedule.get(check_slot)
                                
                                if (not check_class or 
                                    check_class.get('course_code') != course_code or
                                    check_class.get('teacher') != teacher or
                                    check_class.get('type') != 'lab'):
                                    consecutive_valid = False
                                    break
                            
                            if consecutive_valid:
                                score += 200  # Big bonus for proper consecutive placement
                            else:
                                score -= 100  # Penalty for broken consecutive sequence
                    
                    elif total_duration > 1 and not is_consecutive:
                        score -= 150  # Penalty for lab that should be consecutive but isn't
                    
                    else:
                        score += 10  # Small bonus for single-period labs
        
        return score
    
    def _check_no_conflicts(self, timetable):
        """Check for scheduling conflicts"""
        score = 0
        
        for day, day_schedule in timetable.items():
            teachers_at_time = {}
            rooms_at_time = {}
            
            for time_slot, class_info in day_schedule.items():
                if not class_info:
                    continue
                    
                teacher = class_info.get('teacher', '')
                room = class_info.get('room', '')
                
                # Check teacher conflicts
                if time_slot not in teachers_at_time:
                    teachers_at_time[time_slot] = []
                if teacher in teachers_at_time[time_slot]:
                    score -= 200  # Penalty for teacher conflict
                else:
                    teachers_at_time[time_slot].append(teacher)
                    score += 10  # Reward for no conflict
                
                # Check room conflicts (less strict for consecutive lab sessions of same course)
                if time_slot not in rooms_at_time:
                    rooms_at_time[time_slot] = {}
                
                if room in rooms_at_time[time_slot]:
                    existing_class = rooms_at_time[time_slot][room]
                    # Allow same course consecutive lab sessions in same room
                    if (class_info.get('course_code') == existing_class.get('course_code') and
                        class_info.get('type') == 'lab' and existing_class.get('type') == 'lab' and
                        class_info.get('is_consecutive') and existing_class.get('is_consecutive')):
                        score += 5  # Small bonus for using same lab room for consecutive sessions
                    else:
                        score -= 150  # Penalty for room conflict
                else:
                    rooms_at_time[time_slot][room] = class_info
                    score += 5  # Reward for no conflict
        
        return score
    
    def _check_teacher_workload(self, timetable):
        """Check if teacher workload is balanced"""
        score = 0
        teacher_hours = {}
        
        for day, day_schedule in timetable.items():
            for time_slot, class_info in day_schedule.items():
                if class_info:
                    teacher = class_info.get('teacher', '')
                    if teacher not in teacher_hours:
                        teacher_hours[teacher] = 0
                    teacher_hours[teacher] += 1
        
        if teacher_hours:
            avg_hours = sum(teacher_hours.values()) / len(teacher_hours)
            for hours in teacher_hours.values():
                if hours <= avg_hours * 1.2:  # Within 20% of average
                    score += 20
                else:
                    score -= 10  # Penalty for overload
        
        return score
    
    def _check_room_utilization(self, timetable):
        """Check room utilization efficiency"""
        score = 0
        room_usage = {}
        
        for day, day_schedule in timetable.items():
            for time_slot, class_info in day_schedule.items():
                if class_info:
                    room = class_info.get('room', 'Room 1')
                    if room not in room_usage:
                        room_usage[room] = 0
                    room_usage[room] += 1
        
        # Reward balanced room usage
        if room_usage:
            total_classes = sum(room_usage.values())
            for usage in room_usage.values():
                utilization_rate = usage / total_classes
                if 0.1 <= utilization_rate <= 0.4:  # Good utilization range
                    score += 15
        
        return score
    
    def _check_course_completion(self, timetable):
        """Check if all courses have required number of classes scheduled"""
        score = 0
        course_counts = {}
        
        for day, day_schedule in timetable.items():
            for time_slot, class_info in day_schedule.items():
                if class_info:
                    course_code = class_info.get('course_code', '')
                    if course_code not in course_counts:
                        course_counts[course_code] = 0
                    course_counts[course_code] += 1
        
        for course in self.courses:
            scheduled = course_counts.get(course.code, 0)
            required = course.lectures_per_week
            
            if scheduled == required:
                score += 100  # Perfect completion
            elif scheduled > required:
                score += 50 - (scheduled - required) * 10  # Penalty for over-scheduling
            else:
                score += (scheduled / required) * 80  # Partial credit
        
        return score
    
    def _tournament_selection(self, population, fitness_scores, tournament_size=5):
        """Select individual using tournament selection"""
        tournament_indices = random.sample(range(len(population)), min(tournament_size, len(population)))
        best_index = max(tournament_indices, key=lambda i: fitness_scores[i])
        return copy.deepcopy(population[best_index])
    
    def _crossover(self, parent1, parent2):
        """Crossover two timetables while preserving consecutive lab sessions"""
        child = {}
        
        for day in self.working_days:
            child[day] = {}
            for time_slot in self.time_slots:
                if random.random() < 0.5:
                    child[day][time_slot] = copy.deepcopy(parent1[day][time_slot])
                else:
                    child[day][time_slot] = copy.deepcopy(parent2[day][time_slot])
        
        return child
    
    def _mutate(self, individual):
        """Mutate an individual while preserving consecutive lab sessions"""
        mutated = copy.deepcopy(individual)
        
        # Swap mutation - but avoid breaking consecutive lab sessions
        if random.random() < 0.5:
            attempts = 0
            while attempts < 10:  # Try multiple times to find valid swap
                day1, day2 = random.choices(self.working_days, k=2)
                slot1, slot2 = random.choices(self.time_slots, k=2)
                
                class1 = mutated[day1][slot1]
                class2 = mutated[day2][slot2]
                
                # Don't break consecutive lab sessions
                if ((not class1 or not class1.get('is_consecutive')) and 
                    (not class2 or not class2.get('is_consecutive'))):
                    mutated[day1][slot1], mutated[day2][slot2] = class2, class1
                    break
                
                attempts += 1
        
        return mutated
    
    def optimize(self):
        """Run the genetic algorithm optimization"""
        # Create initial population
        population = [self.create_individual() for _ in range(self.population_size)]
        
        best_fitness = 0
        best_individual = None
        convergence_history = []
        
        for generation in range(self.generations):
            # Calculate fitness for all individuals
            fitness_scores = []
            for individual in population:
                fitness = self.calculate_fitness(individual)
                fitness_scores.append(fitness)
                
                if fitness > best_fitness:
                    best_fitness = fitness
                    best_individual = copy.deepcopy(individual)
            
            convergence_history.append(best_fitness)
            
            # Selection and breeding
            new_population = []
            
            # Keep elite individuals
            elite_indices = sorted(range(len(fitness_scores)), key=lambda i: fitness_scores[i], reverse=True)[:self.elite_size]
            for i in elite_indices:
                new_population.append(copy.deepcopy(population[i]))
            
            # Generate offspring
            while len(new_population) < self.population_size:
                parent1 = self._tournament_selection(population, fitness_scores)
                parent2 = self._tournament_selection(population, fitness_scores)
                
                if random.random() < self.crossover_rate:
                    child = self._crossover(parent1, parent2)
                else:
                    child = copy.deepcopy(parent1)
                
                if random.random() < self.mutation_rate:
                    child = self._mutate(child)
                
                new_population.append(child)
            
            population = new_population
        
        # Generate summary
        summary = self._generate_summary(best_individual)
        
        return {
            'timetable': best_individual,
            'fitness_score': best_fitness,
            'summary': summary,
            'generation': self.generations,
            'convergence_history': convergence_history
        }
    
    def _generate_summary(self, timetable):
        """Generate summary statistics"""
        total_classes = 0
        course_counts = {}
        teacher_workload = {}
        room_utilization = {}
        consecutive_labs = 0
        
        for day, day_schedule in timetable.items():
            for time_slot, class_info in day_schedule.items():
                if class_info:
                    total_classes += 1
                    course_code = class_info.get('course_code', '')
                    teacher = class_info.get('teacher', '')
                    room = class_info.get('room', '')
                    
                    if class_info.get('type') == 'lab' and class_info.get('is_consecutive'):
                        consecutive_labs += 1
                    
                    course_counts[course_code] = course_counts.get(course_code, 0) + 1
                    teacher_workload[teacher] = teacher_workload.get(teacher, 0) + 1
                    room_utilization[room] = room_utilization.get(room, 0) + 1
        
        return {
            'total_classes_scheduled': total_classes,
            'consecutive_lab_sessions': consecutive_labs,
            'courses_completion': {course.code: {'scheduled': course_counts.get(course.code, 0), 
                                               'required': course.lectures_per_week,
                                               'completion_rate': (course_counts.get(course.code, 0) / course.lectures_per_week) * 100}
                                 for course in self.courses},
            'teacher_workload': teacher_workload,
            'room_utilization': room_utilization
        }
