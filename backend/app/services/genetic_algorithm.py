import random
import copy
from typing import List, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class Course:
    code: str
    name: str
    teacher: str
    lectures_per_week: int
    type: str = "lecture"  # "lecture" or "lab"
    duration: int = 45

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
        
        # Parse custom constraints
        self.custom_constraints = self._parse_custom_constraints(constraints.get('custom_constraints', []))
        
        # Generate time slots
        self.time_slots = self._generate_time_slots()
        self.working_days = constraints.get('working_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
        
    def _parse_custom_constraints(self, custom_constraints):
        """Parse natural language constraints into structured rules"""
        parsed = {
            'consecutive_labs': [],
            'teacher_unavailable': [],
            'time_restrictions': [],
            'consecutive_lectures': []
        }
        
        for constraint in custom_constraints:
            if not constraint or not constraint.strip():
                continue
                
            constraint_lower = constraint.lower().strip()
            
            # Parse consecutive lab constraints
            if 'lab' in constraint_lower and 'consecutive' in constraint_lower:
                if 'lecture' in constraint_lower or 'theory' in constraint_lower:
                    # Extract course code/subject
                    words = constraint.split()
                    for word in words:
                        if any(c.isdigit() for c in word) and len(word) <= 6:  # Likely course code
                            parsed['consecutive_labs'].append({
                                'course_pattern': word.upper(),
                                'type': 'after_lectures'
                            })
                            break
                    else:
                        # General rule for all labs
                        parsed['consecutive_labs'].append({
                            'course_pattern': '*',
                            'type': 'after_lectures'
                        })
            
            # Parse teacher availability constraints
            elif 'not available' in constraint_lower:
                words = constraint.split()
                teacher_name = ""
                unavailable_day = ""
                
                # Extract teacher name
                for i, word in enumerate(words):
                    if word.lower() in ['mr.', 'ms.', 'mrs.', 'dr.', 'prof.']:
                        if i + 1 < len(words):
                            teacher_name = f"{word} {words[i + 1]}"
                            break
                
                # Extract day
                days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                for day in days:
                    if day in constraint_lower:
                        unavailable_day = day.capitalize()
                        break
                
                if teacher_name and unavailable_day:
                    parsed['teacher_unavailable'].append({
                        'teacher': teacher_name,
                        'day': unavailable_day
                    })
        
        return parsed
    
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
    
    def calculate_fitness(self, timetable):
        """Enhanced fitness calculation with consecutive lab constraints"""
        fitness = 1000  # Base fitness
        
        # Check basic constraints
        fitness += self._check_no_conflicts(timetable) * 500
        fitness += self._check_teacher_workload(timetable) * 300
        fitness += self._check_room_utilization(timetable) * 200
        
        # Check consecutive lab constraints
        fitness += self._check_consecutive_labs(timetable) * 400
        
        # Check custom constraints
        fitness += self._check_custom_constraints(timetable) * 300
        
        # Check course completion
        fitness += self._check_course_completion(timetable) * 600
        
        return max(0, fitness)
    
    def _check_consecutive_labs(self, timetable):
        """Check if labs are scheduled consecutively after lectures"""
        score = 0
        
        for constraint in self.custom_constraints['consecutive_labs']:
            course_pattern = constraint['course_pattern']
            
            for day in self.working_days:
                if day not in timetable:
                    continue
                    
                day_schedule = timetable[day]
                time_slots = sorted(day_schedule.keys(), key=lambda x: tuple(map(int, x.split(':'))))
                
                # Find lectures and labs for matching courses
                lectures = []
                labs = []
                
                for i, time_slot in enumerate(time_slots):
                    class_info = day_schedule.get(time_slot)
                    if not class_info:
                        continue
                    
                    course_code = class_info.get('course_code', '')
                    class_type = class_info.get('type', 'lecture')
                    
                    # Check if course matches pattern
                    if course_pattern == '*' or course_pattern in course_code:
                        if class_type == 'lecture':
                            lectures.append((i, time_slot, course_code))
                        elif class_type == 'lab':
                            labs.append((i, time_slot, course_code))
                
                # Check if labs are consecutive after lectures for same course
                for lab_info in labs:
                    lab_index, lab_time, lab_course = lab_info
                    
                    # Find preceding lectures of same course
                    for lecture_info in lectures:
                        lecture_index, lecture_time, lecture_course = lecture_info
                        
                        # Check if same course and lab is immediately after lecture
                        if (lab_course == lecture_course and 
                            lab_index == lecture_index + 1):
                            score += 50  # Reward consecutive scheduling
                        elif (lab_course == lecture_course and 
                              lab_index > lecture_index and 
                              lab_index <= lecture_index + 2):  # Within 2 slots
                            score += 25  # Partial reward for nearby scheduling
        
        return score
    
    def _check_custom_constraints(self, timetable):
        """Check custom constraints like teacher availability"""
        score = 0
        
        # Check teacher unavailability
        for constraint in self.custom_constraints['teacher_unavailable']:
            teacher = constraint['teacher'].lower()
            day = constraint['day']
            
            if day in timetable:
                day_schedule = timetable[day]
                for time_slot, class_info in day_schedule.items():
                    if class_info and teacher in class_info.get('teacher', '').lower():
                        score -= 100  # Penalty for violating availability
        
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
                
                # Check room conflicts
                if time_slot not in rooms_at_time:
                    rooms_at_time[time_slot] = []
                if room in rooms_at_time[time_slot]:
                    score -= 150  # Penalty for room conflict
                else:
                    rooms_at_time[time_slot].append(room)
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
    
    def create_individual(self):
        """Create a random timetable individual with consecutive lab logic"""
        timetable = {}
        
        # Initialize empty timetable
        for day in self.working_days:
            timetable[day] = {}
            for time_slot in self.time_slots:
                timetable[day][time_slot] = None
        
        # Schedule classes with consecutive lab constraint consideration
        all_classes = []
        for course in self.courses:
            for i in range(course.lectures_per_week):
                class_info = {
                    'course_code': course.code,
                    'course_name': course.name,
                    'teacher': course.teacher,
                    'type': course.type,
                    'room': f"{'Lab' if course.type == 'lab' else 'Room'} {random.randint(1, self.resources.get('classrooms', 5))}"
                }
                all_classes.append(class_info)
        
        # Group classes by course for consecutive scheduling
        course_classes = {}
        for class_info in all_classes:
            course_code = class_info['course_code']
            if course_code not in course_classes:
                course_classes[course_code] = {'lectures': [], 'labs': []}
            
            if class_info['type'] == 'lab':
                course_classes[course_code]['labs'].append(class_info)
            else:
                course_classes[course_code]['lectures'].append(class_info)
        
        # Schedule classes with consecutive preference
        for course_code, classes in course_classes.items():
            lectures = classes['lectures']
            labs = classes['labs']
            
            # Schedule lectures first
            for lecture in lectures:
                placed = False
                attempts = 0
                while not placed and attempts < 50:
                    day = random.choice(self.working_days)
                    time_slot = random.choice(self.time_slots)
                    
                    if timetable[day][time_slot] is None:
                        timetable[day][time_slot] = lecture
                        placed = True
                    attempts += 1
            
            # Schedule labs consecutively after lectures when possible
            for lab in labs:
                placed = False
                attempts = 0
                
                # First try to place after a lecture of the same course
                for day in self.working_days:
                    for i, time_slot in enumerate(self.time_slots[:-1]):  # Leave room for next slot
                        current_class = timetable[day][time_slot]
                        next_slot = self.time_slots[i + 1]
                        
                        if (current_class and 
                            current_class.get('course_code') == course_code and
                            current_class.get('type') == 'lecture' and
                            timetable[day][next_slot] is None):
                            
                            timetable[day][next_slot] = lab
                            placed = True
                            break
                    if placed:
                        break
                
                # If consecutive placement failed, place randomly
                if not placed:
                    while not placed and attempts < 50:
                        day = random.choice(self.working_days)
                        time_slot = random.choice(self.time_slots)
                        
                        if timetable[day][time_slot] is None:
                            timetable[day][time_slot] = lab
                            placed = True
                        attempts += 1
        
        return timetable
    
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
    
    def _tournament_selection(self, population, fitness_scores, tournament_size=5):
        """Select individual using tournament selection"""
        tournament_indices = random.sample(range(len(population)), min(tournament_size, len(population)))
        best_index = max(tournament_indices, key=lambda i: fitness_scores[i])
        return copy.deepcopy(population[best_index])
    
    def _crossover(self, parent1, parent2):
        """Crossover two timetables"""
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
        """Mutate an individual"""
        mutated = copy.deepcopy(individual)
        
        # Random swap mutation
        if random.random() < 0.5:
            day1, day2 = random.choices(self.working_days, k=2)
            slot1, slot2 = random.choices(self.time_slots, k=2)
            
            mutated[day1][slot1], mutated[day2][slot2] = mutated[day2][slot2], mutated[day1][slot1]
        
        return mutated
    
    def _generate_summary(self, timetable):
        """Generate summary statistics"""
        total_classes = 0
        course_counts = {}
        teacher_workload = {}
        room_utilization = {}
        
        for day, day_schedule in timetable.items():
            for time_slot, class_info in day_schedule.items():
                if class_info:
                    total_classes += 1
                    course_code = class_info.get('course_code', '')
                    teacher = class_info.get('teacher', '')
                    room = class_info.get('room', '')
                    
                    course_counts[course_code] = course_counts.get(course_code, 0) + 1
                    teacher_workload[teacher] = teacher_workload.get(teacher, 0) + 1
                    room_utilization[room] = room_utilization.get(room, 0) + 1
        
        return {
            'total_classes_scheduled': total_classes,
            'courses_completion': {course.code: {'scheduled': course_counts.get(course.code, 0), 
                                               'required': course.lectures_per_week,
                                               'completion_rate': (course_counts.get(course.code, 0) / course.lectures_per_week) * 100}
                                 for course in self.courses},
            'teacher_workload': teacher_workload,
            'room_utilization': room_utilization
        }
