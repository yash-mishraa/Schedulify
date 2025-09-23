import random
import copy
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import numpy as np

@dataclass
class Course:
    code: str
    name: str
    teacher: str
    lectures_per_week: int
    type: str  # "lecture" or "lab"
    duration: int  # in minutes

@dataclass
class TimeSlot:
    day: str
    start_time: str
    end_time: str
    
@dataclass
class Constraint:
    type: str
    description: str
    parameters: Dict[str, Any]

class GeneticTimetableOptimizer:
    def __init__(self, courses: List[Course], constraints: Dict[str, Any], resources: Dict[str, int]):
        self.courses = courses
        self.constraints = constraints
        self.resources = resources
        self.population_size = 100
        self.generations = 300
        self.mutation_rate = 0.15
        self.crossover_rate = 0.8
        self.elite_size = 10
        
        # Generate time slots based on constraints
        self.time_slots = self._generate_time_slots()
        self.working_days = constraints.get('working_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'])
        
    def _generate_time_slots(self) -> List[TimeSlot]:
        """Generate time slots based on institution timing and lecture duration"""
        slots = []
        start_time = self.constraints['start_time']  # e.g., "09:15"
        end_time = self.constraints['end_time']      # e.g., "16:55"
        duration = self.constraints['lecture_duration']  # e.g., 45 minutes
        
        for day in self.constraints.get('working_days', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']):
            current_time = self._time_to_minutes(start_time)
            end_minutes = self._time_to_minutes(end_time)
            
            while current_time + duration <= end_minutes:
                # Skip lunch break if specified
                lunch_start = self.constraints.get('lunch_start')
                lunch_end = self.constraints.get('lunch_end')
                
                if lunch_start and lunch_end:
                    lunch_start_min = self._time_to_minutes(lunch_start)
                    lunch_end_min = self._time_to_minutes(lunch_end)
                    
                    if current_time >= lunch_start_min and current_time < lunch_end_min:
                        current_time = lunch_end_min
                        continue
                
                start_str = self._minutes_to_time(current_time)
                end_str = self._minutes_to_time(current_time + duration)
                
                slots.append(TimeSlot(day=day, start_time=start_str, end_time=end_str))
                current_time += duration
                
        return slots
    
    def _time_to_minutes(self, time_str: str) -> int:
        """Convert time string to minutes since midnight"""
        hours, minutes = map(int, time_str.split(':'))
        return hours * 60 + minutes
    
    def _minutes_to_time(self, minutes: int) -> str:
        """Convert minutes since midnight to time string"""
        hours = minutes // 60
        mins = minutes % 60
        return f"{hours:02d}:{mins:02d}"
    
    def create_individual(self) -> Dict[str, Any]:
        """Create a random timetable individual"""
        timetable = {}
        
        # Initialize empty timetable
        for slot in self.time_slots:
            if slot.day not in timetable:
                timetable[slot.day] = {}
            timetable[slot.day][slot.start_time] = None
        
        # Assign courses to random slots
        available_slots = [(slot.day, slot.start_time) for slot in self.time_slots]
        
        for course in self.courses:
            assigned_count = 0
            attempts = 0
            max_attempts = len(available_slots) * 2
            
            while assigned_count < course.lectures_per_week and attempts < max_attempts:
                if not available_slots:
                    break
                    
                day, time = random.choice(available_slots)
                
                # Check if slot is available and constraints are satisfied
                if (timetable[day][time] is None and 
                    self._check_teacher_availability(timetable, course.teacher, day, time) and
                    self._check_custom_constraints(course, day, time)):
                    
                    # Assign room
                    room = self._assign_room(course.type)
                    
                    timetable[day][time] = {
                        'course_code': course.code,
                        'course_name': course.name,
                        'teacher': course.teacher,
                        'type': course.type,
                        'room': room
                    }
                    
                    assigned_count += 1
                    available_slots.remove((day, time))
                
                attempts += 1
        
        return timetable
    
    def _check_teacher_availability(self, timetable: Dict, teacher: str, day: str, time: str) -> bool:
        """Check if teacher is available at given time"""
        if day in timetable and time in timetable[day]:
            slot = timetable[day][time]
            if slot and slot.get('teacher') == teacher:
                return False
        return True
    
    def _check_custom_constraints(self, course: Course, day: str, time: str) -> bool:
        """Check custom constraints from guideline box"""
        custom_constraints = self.constraints.get('custom_constraints', [])
        
        for constraint in custom_constraints:
            # Teacher availability constraints
            if 'not_available' in constraint.lower():
                if course.teacher.lower() in constraint.lower() and day.lower() in constraint.lower():
                    return False
            
            # Time-specific constraints
            if 'no_classes_after' in constraint.lower():
                # Extract time and compare
                pass  # Implement specific time checks
                
        return True
    
    def _assign_room(self, course_type: str) -> str:
        """Assign appropriate room based on course type"""
        if course_type.lower() == 'lab':
            lab_count = self.resources.get('labs', 5)
            return f"Lab {random.randint(1, lab_count)}"
        else:
            classroom_count = self.resources.get('classrooms', 10)
            return f"Room {random.randint(1, classroom_count)}"
    
    def calculate_fitness(self, individual: Dict[str, Any]) -> float:
        """Calculate fitness score for an individual timetable"""
        fitness = 1000.0  # Starting fitness
        
        # Penalize conflicts
        fitness -= self._count_teacher_conflicts(individual) * 100
        fitness -= self._count_room_conflicts(individual) * 80
        fitness -= self._count_constraint_violations(individual) * 60
        
        # Reward good distribution
        fitness += self._calculate_workload_distribution(individual) * 20
        fitness += self._calculate_gap_optimization(individual) * 10
        fitness += self._calculate_course_completion(individual) * 50
        
        return max(0, fitness)
    
    def _count_teacher_conflicts(self, timetable: Dict) -> int:
        """Count teacher scheduling conflicts"""
        conflicts = 0
        for day in timetable:
            teachers_at_time = {}
            for time_slot in timetable[day]:
                if timetable[day][time_slot]:
                    teacher = timetable[day][time_slot]['teacher']
                    if teacher not in teachers_at_time:
                        teachers_at_time[teacher] = []
                    teachers_at_time[teacher].append(time_slot)
            
            # Check for conflicts
            for teacher, times in teachers_at_time.items():
                if len(times) > len(set(times)):  # Duplicate time slots
                    conflicts += len(times) - len(set(times))
        
        return conflicts
    
    def _count_room_conflicts(self, timetable: Dict) -> int:
        """Count room scheduling conflicts"""
        conflicts = 0
        for day in timetable:
            rooms_at_time = {}
            for time_slot in timetable[day]:
                if timetable[day][time_slot]:
                    room = timetable[day][time_slot]['room']
                    time_key = time_slot
                    
                    if time_key not in rooms_at_time:
                        rooms_at_time[time_key] = []
                    rooms_at_time[time_key].append(room)
            
            # Count room conflicts
            for time_slot, rooms in rooms_at_time.items():
                room_counts = {}
                for room in rooms:
                    room_counts[room] = room_counts.get(room, 0) + 1
                    if room_counts[room] > 1:
                        conflicts += room_counts[room] - 1
        
        return conflicts
    
    def _calculate_course_completion(self, timetable: Dict) -> float:
        """Calculate how well course requirements are met"""
        completion_score = 0
        total_required = sum(course.lectures_per_week for course in self.courses)
        total_assigned = 0
        
        for day in timetable:
            for time_slot in timetable[day]:
                if timetable[day][time_slot]:
                    total_assigned += 1
        
        if total_required > 0:
            completion_score = (total_assigned / total_required) * 100
        
        return min(completion_score, 100)
    
    def crossover(self, parent1: Dict, parent2: Dict) -> Dict:
        """Create offspring using crossover"""
        child = copy.deepcopy(parent1)
        
        # Random day-wise crossover
        days = list(parent1.keys())
        crossover_point = random.randint(1, len(days) - 1)
        
        for i in range(crossover_point, len(days)):
            child[days[i]] = copy.deepcopy(parent2[days[i]])
        
        return child
    
    def mutate(self, individual: Dict) -> Dict:
        """Apply mutation to an individual"""
        if random.random() > self.mutation_rate:
            return individual
        
        mutated = copy.deepcopy(individual)
        
        # Random slot swap within a day
        days = list(mutated.keys())
        random_day = random.choice(days)
        
        time_slots = list(mutated[random_day].keys())
        if len(time_slots) >= 2:
            slot1, slot2 = random.sample(time_slots, 2)
            mutated[random_day][slot1], mutated[random_day][slot2] = \
                mutated[random_day][slot2], mutated[random_day][slot1]
        
        return mutated
    
    def selection(self, population: List[Tuple[Dict, float]]) -> List[Dict]:
        """Tournament selection"""
        selected = []
        tournament_size = 5
        
        for _ in range(self.population_size):
            tournament = random.sample(population, min(tournament_size, len(population)))
            winner = max(tournament, key=lambda x: x[1])
            selected.append(winner[0])
        
        return selected
    
    def optimize(self) -> Dict[str, Any]:
        """Main genetic algorithm execution"""
        # Initialize population
        population = [self.create_individual() for _ in range(self.population_size)]
        
        best_fitness = 0
        best_individual = None
        stagnation_count = 0
        max_stagnation = 50
        
        for generation in range(self.generations):
            # Evaluate fitness
            fitness_scores = [(ind, self.calculate_fitness(ind)) for ind in population]
            fitness_scores.sort(key=lambda x: x[1], reverse=True)
            
            current_best_fitness = fitness_scores[0][1]
            
            # Update best solution
            if current_best_fitness > best_fitness:
                best_fitness = current_best_fitness
                best_individual = copy.deepcopy(fitness_scores[0][0])
                stagnation_count = 0
            else:
                stagnation_count += 1
            
            # Early termination conditions
            if best_fitness >= 950:  # Near-perfect solution
                break
            
            if stagnation_count >= max_stagnation:
                # Restart with new random population, keeping elite
                elite = [ind for ind, _ in fitness_scores[:self.elite_size]]
                new_population = elite + [self.create_individual() for _ in range(self.population_size - self.elite_size)]
                population = new_population
                stagnation_count = 0
                continue
            
            # Selection and reproduction
            new_population = []
            
            # Keep elite solutions
            elite = [ind for ind, _ in fitness_scores[:self.elite_size]]
            new_population.extend(elite)
            
            # Generate offspring
            while len(new_population) < self.population_size:
                # Selection
                selected = self.selection(fitness_scores)
                parent1 = random.choice(selected)
                parent2 = random.choice(selected)
                
                # Crossover
                if random.random() < self.crossover_rate:
                    child = self.crossover(parent1, parent2)
                else:
                    child = copy.deepcopy(parent1)
                
                # Mutation
                child = self.mutate(child)
                new_population.append(child)
            
            population = new_population[:self.population_size]
            
            # Progress update
            if generation % 50 == 0:
                print(f"Generation {generation}: Best Fitness = {best_fitness:.2f}")
        
        # Generate summary
        summary = self._generate_summary(best_individual)
        
        return {
            'timetable': best_individual,
            'fitness_score': best_fitness,
            'summary': summary,
            'generation': generation
        }
    
    def _generate_summary(self, timetable: Dict) -> Dict[str, Any]:
        """Generate timetable summary and statistics"""
        summary = {
            'total_classes_scheduled': 0,
            'courses_completion': {},
            'teacher_workload': {},
            'room_utilization': {},
            'constraint_violations': [],
            'recommendations': []
        }
        
        # Count scheduled classes and analyze completion
        for course in self.courses:
            scheduled_count = 0
            for day in timetable:
                for time_slot in timetable[day]:
                    if (timetable[day][time_slot] and 
                        timetable[day][time_slot]['course_code'] == course.code):
                        scheduled_count += 1
            
            summary['courses_completion'][course.code] = {
                'scheduled': scheduled_count,
                'required': course.lectures_per_week,
                'completion_rate': (scheduled_count / course.lectures_per_week * 100) if course.lectures_per_week > 0 else 0
            }
            summary['total_classes_scheduled'] += scheduled_count
        
        # Analyze teacher workload
        for day in timetable:
            for time_slot in timetable[day]:
                if timetable[day][time_slot]:
                    teacher = timetable[day][time_slot]['teacher']
                    if teacher not in summary['teacher_workload']:
                        summary['teacher_workload'][teacher] = 0
                    summary['teacher_workload'][teacher] += 1
        
        # Analyze room utilization
        for day in timetable:
            for time_slot in timetable[day]:
                if timetable[day][time_slot]:
                    room = timetable[day][time_slot]['room']
                    if room not in summary['room_utilization']:
                        summary['room_utilization'][room] = 0
                    summary['room_utilization'][room] += 1
        
        # Check for violations and recommendations
        if summary['total_classes_scheduled'] < sum(course.lectures_per_week for course in self.courses):
            summary['constraint_violations'].append("Not all required classes could be scheduled")
            summary['recommendations'].append("Consider extending working hours or adding more days")
        
        # Check teacher conflicts
        teacher_conflicts = self._count_teacher_conflicts(timetable)
        if teacher_conflicts > 0:
            summary['constraint_violations'].append(f"{teacher_conflicts} teacher conflicts detected")
            summary['recommendations'].append("Review teacher assignments for conflicting time slots")
        
        return summary
    
    def _calculate_workload_distribution(self, timetable: Dict) -> float:
        """Calculate workload distribution score"""
        daily_counts = {}
        
        for day in timetable:
            daily_counts[day] = sum(1 for slot in timetable[day] if timetable[day][slot])
        
        if not daily_counts:
            return 0
        
        # Calculate standard deviation (lower is better for distribution)
        mean_workload = sum(daily_counts.values()) / len(daily_counts)
        variance = sum((count - mean_workload) ** 2 for count in daily_counts.values()) / len(daily_counts)
        std_dev = variance ** 0.5
        
        # Convert to score (lower std_dev = higher score)
        distribution_score = max(0, 10 - std_dev)
        return distribution_score
    
    def _calculate_gap_optimization(self, timetable: Dict) -> float:
        """Calculate gap optimization score (fewer gaps between classes is better)"""
        gap_penalty = 0
        
        for day in timetable:
            day_schedule = []
            for time_slot in sorted(timetable[day].keys()):
                if timetable[day][time_slot]:
                    day_schedule.append(1)
                else:
                    day_schedule.append(0)
            
            # Count gaps between classes
            if len(day_schedule) > 0:
                first_class = -1
                last_class = -1
                
                for i, has_class in enumerate(day_schedule):
                    if has_class:
                        if first_class == -1:
                            first_class = i
                        last_class = i
                
                # Count gaps between first and last class
                if first_class != -1 and last_class != -1:
                    gaps = sum(1 for i in range(first_class, last_class + 1) if day_schedule[i] == 0)
                    gap_penalty += gaps
        
        # Convert penalty to score
        gap_score = max(0, 20 - gap_penalty)
        return gap_score
    
    def _count_constraint_violations(self, timetable: Dict) -> int:
        """Count custom constraint violations"""
        violations = 0
        custom_constraints = self.constraints.get('custom_constraints', [])
        
        for constraint in custom_constraints:
            constraint_lower = constraint.lower()
            
            # Example: "Dr. Smith not available on Monday"
            if 'not available' in constraint_lower:
                words = constraint_lower.split()
                teacher_found = False
                day_found = False
                teacher_name = ""
                day_name = ""
                
                # Extract teacher name and day
                days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                
                for word in words:
                    if word in days:
                        day_found = True
                        day_name = word.capitalize()
                        break
                
                # Simple teacher name extraction (assuming "Dr. Name" pattern)
                for i, word in enumerate(words):
                    if word in ['dr.', 'prof.', 'mr.', 'mrs.', 'ms.']:
                        if i + 1 < len(words):
                            teacher_name = f"{word.title()} {words[i+1].title()}"
                            teacher_found = True
                            break
                    elif word.title() in [course.teacher for course in self.courses]:
                        teacher_name = word.title()
                        teacher_found = True
                        break
                
                # Check violation
                if teacher_found and day_found and day_name in timetable:
                    for time_slot in timetable[day_name]:
                        if (timetable[day_name][time_slot] and 
                            teacher_name.lower() in timetable[day_name][time_slot]['teacher'].lower()):
                            violations += 1
        
        return violations
