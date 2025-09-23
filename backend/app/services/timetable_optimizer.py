from typing import Dict, List, Any, Optional, Tuple
import random
import copy
from dataclasses import dataclass
from app.services.genetic_algorithm import GeneticTimetableOptimizer, Course
from app.models.constraints import ConstraintSet, parse_natural_language_constraint
from app.utils.constraints_checker import ConstraintsChecker
import logging

logger = logging.getLogger(__name__)

@dataclass
class OptimizationResult:
    timetable: Dict[str, Any]
    fitness_score: float
    summary: Dict[str, Any]
    generation_count: int
    optimization_time: float
    convergence_history: List[float]
    constraint_violations: List[str]
    recommendations: List[str]

class TimetableOptimizer:
    """Enhanced timetable optimizer with multiple algorithms and advanced features"""
    
    def __init__(self):
        self.algorithms = {
            'genetic': self._genetic_algorithm,
            'simulated_annealing': self._simulated_annealing,
            'hybrid': self._hybrid_algorithm
        }
        self.constraints_checker = ConstraintsChecker()
    
    def optimize(self, 
                courses: List[Course],
                constraints: Dict[str, Any],
                resources: Dict[str, int],
                algorithm: str = 'genetic',
                custom_constraints: List[str] = None) -> OptimizationResult:
        """
        Main optimization method with multiple algorithm options
        """
        import time
        start_time = time.time()
        
        # Parse and validate constraints
        constraint_set = self._build_constraint_set(constraints, custom_constraints)
        validation_result = constraint_set.validate_constraints()
        
        if not validation_result['is_valid']:
            logger.warning(f"Constraint validation issues: {validation_result['errors']}")
        
        # Choose and run optimization algorithm
        algorithm_func = self.algorithms.get(algorithm, self._genetic_algorithm)
        result = algorithm_func(courses, constraints, resources, constraint_set)
        
        optimization_time = time.time() - start_time
        
        # Post-process results
        enhanced_result = self._post_process_result(
            result, 
            constraint_set, 
            optimization_time,
            validation_result
        )
        
        return enhanced_result
    
    def _genetic_algorithm(self, 
                          courses: List[Course],
                          constraints: Dict[str, Any],
                          resources: Dict[str, int],
                          constraint_set: ConstraintSet) -> Dict[str, Any]:
        """Standard genetic algorithm optimization"""
        optimizer = GeneticTimetableOptimizer(courses, constraints, resources)
        
        # Configure GA parameters based on problem complexity
        problem_size = len(courses) * sum(course.lectures_per_week for course in courses)
        
        if problem_size < 50:
            optimizer.population_size = 50
            optimizer.generations = 200
        elif problem_size < 100:
            optimizer.population_size = 80
            optimizer.generations = 300
        else:
            optimizer.population_size = 120
            optimizer.generations = 500
        
        return optimizer.optimize()
    
    def _simulated_annealing(self,
                           courses: List[Course],
                           constraints: Dict[str, Any],
                           resources: Dict[str, int],
                           constraint_set: ConstraintSet) -> Dict[str, Any]:
        """Simulated annealing optimization algorithm"""
        
        # Initialize with genetic algorithm result as starting point
        ga_optimizer = GeneticTimetableOptimizer(courses, constraints, resources)
        ga_optimizer.population_size = 20
        ga_optimizer.generations = 50
        initial_result = ga_optimizer.optimize()
        
        current_solution = initial_result['timetable']
        current_fitness = initial_result['fitness_score']
        
        best_solution = copy.deepcopy(current_solution)
        best_fitness = current_fitness
        
        # SA parameters
        initial_temperature = 1000.0
        final_temperature = 1.0
        cooling_rate = 0.95
        iterations_per_temperature = 100
        
        temperature = initial_temperature
        iteration = 0
        convergence_history = [current_fitness]
        
        while temperature > final_temperature:
            for _ in range(iterations_per_temperature):
                # Generate neighbor solution
                neighbor = self._generate_neighbor_solution(current_solution)
                neighbor_fitness = ga_optimizer.calculate_fitness(neighbor)
                
                # Accept or reject the neighbor
                if neighbor_fitness > current_fitness:
                    # Better solution - accept
                    current_solution = neighbor
                    current_fitness = neighbor_fitness
                    
                    if neighbor_fitness > best_fitness:
                        best_solution = copy.deepcopy(neighbor)
                        best_fitness = neighbor_fitness
                else:
                    # Worse solution - accept with probability
                    delta = neighbor_fitness - current_fitness
                    probability = random.exp(delta / temperature)
                    
                    if random.random() < probability:
                        current_solution = neighbor
                        current_fitness = neighbor_fitness
                
                iteration += 1
                convergence_history.append(best_fitness)
            
            temperature *= cooling_rate
        
        # Generate summary
        summary = ga_optimizer._generate_summary(best_solution)
        
        return {
            'timetable': best_solution,
            'fitness_score': best_fitness,
            'summary': summary,
            'generation': iteration,
            'convergence_history': convergence_history
        }
    
    def _hybrid_algorithm(self,
                         courses: List[Course],
                         constraints: Dict[str, Any],
                         resources: Dict[str, int],
                         constraint_set: ConstraintSet) -> Dict[str, Any]:
        """Hybrid optimization combining GA and SA"""
        
        # Phase 1: Genetic Algorithm for global exploration
        ga_optimizer = GeneticTimetableOptimizer(courses, constraints, resources)
        ga_optimizer.population_size = 60
        ga_optimizer.generations = 200
        ga_result = ga_optimizer.optimize()
        
        logger.info(f"GA phase completed with fitness: {ga_result['fitness_score']}")
        
        # Phase 2: Simulated Annealing for local refinement
        current_solution = ga_result['timetable']
        current_fitness = ga_result['fitness_score']
        
        # SA parameters (more focused)
        initial_temperature = 100.0
        final_temperature = 1.0
        cooling_rate = 0.9
        iterations_per_temperature = 50
        
        temperature = initial_temperature
        iteration = ga_result['generation']
        convergence_history = [current_fitness]
        
        while temperature > final_temperature:
            for _ in range(iterations_per_temperature):
                neighbor = self._generate_neighbor_solution(current_solution)
                neighbor_fitness = ga_optimizer.calculate_fitness(neighbor)
                
                if neighbor_fitness > current_fitness:
                    current_solution = neighbor
                    current_fitness = neighbor_fitness
                else:
                    delta = neighbor_fitness - current_fitness
                    probability = random.exp(delta / temperature)
                    
                    if random.random() < probability:
                        current_solution = neighbor
                        current_fitness = neighbor_fitness
                
                iteration += 1
                convergence_history.append(current_fitness)
            
            temperature *= cooling_rate
        
        logger.info(f"Hybrid optimization completed with fitness: {current_fitness}")
        
        # Generate final summary
        summary = ga_optimizer._generate_summary(current_solution)
        
        return {
            'timetable': current_solution,
            'fitness_score': current_fitness,
            'summary': summary,
            'generation': iteration,
            'convergence_history': convergence_history
        }
    
    def _generate_neighbor_solution(self, solution: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a neighbor solution for SA by making small random changes"""
        neighbor = copy.deepcopy(solution)
        
        # Choose random modification type
        modification_types = ['swap_time_slots', 'move_class', 'swap_classes']
        modification = random.choice(modification_types)
        
        if modification == 'swap_time_slots':
            # Swap two random time slots within a day
            day = random.choice(list(neighbor.keys()))
            time_slots = list(neighbor[day].keys())
            
            if len(time_slots) >= 2:
                slot1, slot2 = random.sample(time_slots, 2)
                neighbor[day][slot1], neighbor[day][slot2] = neighbor[day][slot2], neighbor[day][slot1]
        
        elif modification == 'move_class':
            # Move a class to a different day/time
            # Find a non-empty slot
            all_slots = []
            for day in neighbor:
                for time_slot in neighbor[day]:
                    if neighbor[day][time_slot] is not None:
                        all_slots.append((day, time_slot))
            
            if all_slots:
                # Pick random class to move
                source_day, source_time = random.choice(all_slots)
                class_info = neighbor[source_day][source_time]
                
                # Find empty slot
                empty_slots = []
                for day in neighbor:
                    for time_slot in neighbor[day]:
                        if neighbor[day][time_slot] is None:
                            empty_slots.append((day, time_slot))
                
                if empty_slots:
                    target_day, target_time = random.choice(empty_slots)
                    neighbor[source_day][source_time] = None
                    neighbor[target_day][target_time] = class_info
        
        elif modification == 'swap_classes':
            # Swap two classes between different slots
            all_slots = []
            for day in neighbor:
                for time_slot in neighbor[day]:
                    if neighbor[day][time_slot] is not None:
                        all_slots.append((day, time_slot))
            
            if len(all_slots) >= 2:
                (day1, time1), (day2, time2) = random.sample(all_slots, 2)
                neighbor[day1][time1], neighbor[day2][time2] = neighbor[day2][time2], neighbor[day1][time1]
        
        return neighbor
    
    def _build_constraint_set(self, 
                             constraints: Dict[str, Any], 
                             custom_constraints: List[str] = None) -> ConstraintSet:
        """Build structured constraint set from input parameters"""
        
        constraint_set = ConstraintSet(
            institution_id=constraints.get('institution_id', 'default'),
            constraints=[]
        )
        
        # Parse custom constraints from natural language
        if custom_constraints:
            for constraint_text in custom_constraints:
                if constraint_text.strip():
                    parsed_constraint = parse_natural_language_constraint(constraint_text)
                    if parsed_constraint:
                        constraint_set.add_constraint(parsed_constraint)
        
        return constraint_set
    
    def _post_process_result(self,
                           result: Dict[str, Any],
                           constraint_set: ConstraintSet,
                           optimization_time: float,
                           validation_result: Dict[str, Any]) -> OptimizationResult:
        """Post-process optimization results with additional analysis"""
        
        # Check constraint violations
        timetable = result['timetable']
        violations = self.constraints_checker.check_all_constraints(timetable, constraint_set)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(result, violations, constraint_set)
        
        # Get convergence history if available
        convergence_history = result.get('convergence_history', [result['fitness_score']])
        
        return OptimizationResult(
            timetable=timetable,
            fitness_score=result['fitness_score'],
            summary=result['summary'],
            generation_count=result['generation'],
            optimization_time=optimization_time,
            convergence_history=convergence_history,
            constraint_violations=violations,
            recommendations=recommendations
        )
    
    def _generate_recommendations(self,
                                result: Dict[str, Any],
                                violations: List[str],
                                constraint_set: ConstraintSet) -> List[str]:
        """Generate optimization recommendations"""
        recommendations = []
        
        fitness_score = result['fitness_score']
        summary = result['summary']
        
        # Fitness-based recommendations
        if fitness_score < 300:
            recommendations.append("Consider reducing the number of required classes or extending working hours")
        elif fitness_score < 600:
            recommendations.append("Try adjusting some constraints to allow more scheduling flexibility")
        
        # Completion rate recommendations
        total_completion = 0
        course_count = 0
        
        for course_code, completion in summary.get('courses_completion', {}).items():
            total_completion += completion.get('completion_rate', 0)
            course_count += 1
        
        if course_count > 0:
            avg_completion = total_completion / course_count
            if avg_completion < 80:
                recommendations.append("Increase available time slots or reduce course requirements")
        
        # Teacher workload recommendations
        teacher_workload = summary.get('teacher_workload', {})
        max_workload = max(teacher_workload.values()) if teacher_workload else 0
        
        if max_workload > 25:
            recommendations.append("Consider balancing teacher workload more evenly")
        
        # Constraint violation recommendations
        if violations:
            recommendations.append("Review and possibly relax some custom constraints to improve scheduling")
        
        # Room utilization recommendations
        room_utilization = summary.get('room_utilization', {})
        if room_utilization:
            avg_room_usage = sum(room_utilization.values()) / len(room_utilization)
            if avg_room_usage > 20:
                recommendations.append("Consider adding more classrooms or labs to reduce congestion")
        
        return recommendations
    
    def get_optimization_statistics(self, result: OptimizationResult) -> Dict[str, Any]:
        """Get detailed optimization statistics"""
        
        convergence_history = result.convergence_history
        
        stats = {
            'final_fitness': result.fitness_score,
            'optimization_time': result.optimization_time,
            'iterations': result.generation_count,
            'convergence_rate': 0,
            'improvement_rate': 0,
            'stability_score': 0
        }
        
        if len(convergence_history) > 1:
            # Calculate convergence rate
            initial_fitness = convergence_history[0]
            final_fitness = convergence_history[-1]
            
            if initial_fitness > 0:
                stats['improvement_rate'] = ((final_fitness - initial_fitness) / initial_fitness) * 100
            
            # Calculate stability (how much the fitness fluctuates)
            if len(convergence_history) > 10:
                last_10_percent = convergence_history[-len(convergence_history)//10:]
                stability_variance = sum((x - final_fitness)**2 for x in last_10_percent) / len(last_10_percent)
                stats['stability_score'] = max(0, 100 - stability_variance)
        
        return stats
