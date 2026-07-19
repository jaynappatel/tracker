export interface Goals {
  calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
  water_goal_oz: number;
  step_goal: number;
  sleep_goal_hrs: number;
  weight_goal_lb: number | null;
}

export const DEFAULT_GOALS: Goals = {
  calorie_goal: 2000,
  protein_goal: 150,
  carb_goal: 200,
  fat_goal: 60,
  water_goal_oz: 100,
  step_goal: 10000,
  sleep_goal_hrs: 8,
  weight_goal_lb: null,
};

export interface Meal {
  id?: string;
  date: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WaterEntry {
  id?: string;
  date: string;
  oz: number;
  logged_at?: string;
}

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  weight: string;
  video_url?: string;
}

export interface WorkoutLog {
  date: string;
  type: string;
  done: boolean;
  exercises: Exercise[];
}

export interface Recipe {
  name: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
}

// ---------- weekly plan (all manually entered, never auto-generated) ----------

export interface WeeklyRecipe {
  id?: string;
  week_start_date?: string | null;
  name: string;
  ingredients: string;
  instructions: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
}

export interface WeeklyPlanMeal {
  id?: string;
  week_start_date?: string | null;
  day_of_week: number; // 0=Sun .. 6=Sat
  slot: string;        // Breakfast / Lunch / Dinner / Snack
  description: string;
}

export interface WeeklyPlanExercise {
  id?: string;
  week_start_date?: string | null;
  workout_type: string;
  name: string;
  sets: string;
  reps: string;
  notes: string;
  video_url: string;
}

export const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const WORKOUT_TYPES = ['Rest', 'Push', 'Pull', 'Legs', 'Full Body', 'Cardio', 'Active Recovery'];
export const DEFAULT_ROTATION = ['Rest', 'Push', 'Pull', 'Legs', 'Rest', 'Full Body', 'Cardio']; // Sun..Sat

export function sumMeals(meals: Meal[]) {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (Number(m.calories) || 0),
      protein: acc.protein + (Number(m.protein) || 0),
      carbs: acc.carbs + (Number(m.carbs) || 0),
      fat: acc.fat + (Number(m.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function pct(val: number, goal: number): number {
  if (!goal) return 0;
  return Math.min(100, Math.round((val / goal) * 100));
}
