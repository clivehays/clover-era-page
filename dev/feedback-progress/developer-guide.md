# Feedback Progress & Monthly Wrapped Feature
## Developer Implementation Guide

**Version:** 2.0
**Date:** December 2024
**Feature:** Weekly Streak & Monthly Wrapped Unlock System

---

## Executive Summary

This document provides implementation specifications for the Feedback Progress feature, which incentivizes daily feedback through a simple mechanic:

> **"Preserve your weekly streaks (75%+) and receive your monthly wrapped insights."**

**Key Design Goals:**
- Encourage consistent daily feedback through streak mechanics
- Accommodate variable work schedules (4, 5, or 6 day weeks)
- Prevent "cliff effect" where users stop engaging after meeting thresholds
- Handle mid-month joiners gracefully with "Practice Mode"

---

## Core Concepts

### 1. Weekly Streak

The streak counts **consecutive weeks at 75%+ completion**. This accommodates variable schedules and gives users flexibility to miss one day per week without penalty.

| Schedule Type | Work Days | Days Needed for 75% |
|--------------|-----------|---------------------|
| 4-day | User-defined 4 days | 3 of 4 |
| 5-day | User-defined 5 days | 4 of 5 |
| 6-day | User-defined 6 days | 5 of 6 |

### 2. Week Boundaries

**A week runs Sunday to Saturday. Weeks belong to the month in which they END (the Saturday).**

This eliminates all partial week complexity. Every week is a full 7-day week.

**December 2024 example:**
| Week | Dates | Belongs To |
|------|-------|------------|
| Week ending Dec 7 | Dec 1-7 | December |
| Week ending Dec 14 | Dec 8-14 | December |
| Week ending Dec 21 | Dec 15-21 | December |
| Week ending Dec 28 | Dec 22-28 | December |
| Week ending Jan 4 | Dec 29-Jan 4 | January |

December 2024 has 4 weeks. January 2025's first week includes Dec 29-31.

### 3. Monthly Wrapped Unlock

Users unlock their Monthly Wrapped insights via **either** of two paths:

**Path 1: Weekly Streaks (Primary)**
Complete **4 qualifying weeks at 75%+** within the calendar month.

**Path 2: Monthly Fallback**
Achieve **75%+ total responses** across all work days in the month.

This dual-path approach ensures users who take a vacation or long weekend aren't penalized. For example, someone who responds 18/20 days (90%) but has one "bad" week due to time off still earns their Wrapped via the monthly fallback.

**Example - Long Weekend Scenario:**
| Week | Work Days | Responses | Weekly % | Qualifies? |
|------|-----------|-----------|----------|------------|
| 1 | 5 | 5 | 100% | Yes |
| 2 | 5 | 5 | 100% | Yes |
| 3 | 5 | 5 | 100% | Yes |
| 4 | 5 | 3 (took Thu-Fri off) | 60% | No |

- Weekly path: 3 qualifying weeks (needs 4) -> **No**
- Monthly fallback: 18/20 = 90% -> **Yes**
- **Result: Wrapped unlocks**

Note: The weekly streak still breaks in week 4. The fallback only affects Wrapped unlock, not streak continuity.

### 4. Practice Mode

Users who join mid-month with fewer than 4 weeks remaining enter Practice Mode. They build streaks normally, but their first Wrapped unlocks at the end of the following month.

### 5. Take a Break (Planned Time Off)

Users can set "take a break" in the app to silence notifications for up to 1 month in advance. Break days are **excluded from all calculations**, preserving streaks for planned absences.

**How break days affect calculations:**

| Scenario | Calculation | Result |
|----------|-------------|--------|
| 5-day worker, Thu-Fri on break | 3 available days that week | 3/3 responses = 100%, qualifies |
| 5-day worker, full week on break | 0 available days | Week skipped, streak paused (not broken) |
| 5-day worker, 2 weeks on break in a 4-week month | Only 2 qualifying opportunities | Cannot reach 4 weeks, no Wrapped |

**Key principles:**

1. **Break days reduce the denominator** - A week with 2 break days becomes a 3-day week
2. **Full weeks on break are skipped** - They don't count as qualifying or non-qualifying
3. **Streaks pause during breaks** - A 6-week streak before a break resumes as a 6-week streak after
4. **Wrapped still requires 4 qualifying weeks** - Breaks reduce opportunities, not requirements

**Take a Break vs. Monthly Fallback:**

| Situation | Best Solution |
|-----------|---------------|
| Planned vacation | Set "take a break" -> preserves streak AND wrapped opportunity |
| Forgotten PTO (didn't set break) | Monthly fallback catches it -> wrapped unlocks, but streak breaks |
| Unexpected sick day | Monthly fallback catches it -> wrapped unlocks, but streak may break |
| Last-minute emergency | Monthly fallback catches it -> wrapped unlocks, but streak breaks |

**Recommendation for users:** Always set "take a break" for planned time off. It's the only way to preserve both streak and wrapped progress.

---

## Data Model

### User Settings (existing)
```
user_settings {
  work_days: string[]  // e.g., ["Mon", "Tue", "Wed", "Thu", "Fri"]
}
```

### Break Days (existing - reference only)
```
user_break_days {
  user_id: string
  break_dates: date[]  // Dates user has marked as "take a break"
}
```

### New Fields Required

```
user_feedback_progress {
  user_id: string

  // Streak tracking
  current_week_streak: integer        // Consecutive qualifying weeks
  last_qualifying_week_end: date      // Saturday of last qualifying week

  // Monthly progress - weekly path
  qualifying_weeks_this_month: integer  // 0-4+, resets each month
  month_year: string                    // "2024-12" format
  wrapped_unlocked: boolean             // Has user unlocked wrapped this month

  // Monthly progress - fallback path
  total_responses_this_month: integer   // Total responses in current month
  total_work_days_this_month: integer   // Total work days in current month

  // Practice mode
  is_practice_mode: boolean             // True if joined mid-month
  first_wrapped_month: string           // "2025-01" - when first wrapped available
  account_created_date: date

  // Current week tracking
  current_week_responses: integer       // Responses this week (resets Sunday)
  current_week_start: date              // Sunday of current week
}
```

### Daily Response Log (likely existing)
```
daily_responses {
  user_id: string
  response_date: date
  responded: boolean
}
```

---

## Business Logic

### Determining Which Month a Week Belongs To

```python
def get_month_for_week(week_start_date):
    """
    Returns the month a week belongs to (the month containing Saturday).
    Week starts Sunday, ends Saturday.
    """
    week_end_date = week_start_date + timedelta(days=6)  # Saturday
    return week_end_date.month, week_end_date.year
```

### Calculating Weekly Completion

```python
def calculate_week_completion(user_id, week_start_date):
    """
    Calculate completion percentage for a specific week.
    Break days are excluded from both numerator and denominator.
    Returns (completed_days, total_work_days, percentage)
    """
    user_settings = get_user_settings(user_id)
    work_days = user_settings.work_days
    break_dates = get_user_break_dates(user_id)

    # Get all dates in the week that match user's work days
    week_dates = get_work_dates_in_week(week_start_date, work_days)

    # Exclude break days from available work days
    available_dates = [d for d in week_dates if d not in break_dates]

    # If entire week is on break, return special case
    if len(available_dates) == 0:
        return 0, 0, None  # None percentage indicates "skipped week"

    # Count responses for available days only
    responses = get_responses_for_dates(user_id, available_dates)
    completed = len([r for r in responses if r.responded])

    total = len(available_dates)
    percentage = (completed / total * 100) if total > 0 else 0

    return completed, total, percentage
```

### Determining if Week Qualifies

```python
QUALIFYING_THRESHOLD = 75  # 75%

def does_week_qualify(user_id, week_start_date):
    """
    Returns True if user met 75%+ threshold for the week.
    Returns None if week was entirely on break (skipped).
    """
    completed, total, percentage = calculate_week_completion(user_id, week_start_date)

    # Week entirely on break - skip it
    if percentage is None:
        return None

    return percentage >= QUALIFYING_THRESHOLD
```

### Processing Week End (Run Every Saturday Night)

```python
def process_week_end(user_id):
    """
    Called at end of each week (Saturday 11:59 PM) to update streak and qualifying weeks.
    """
    progress = get_user_progress(user_id)
    week_start = get_current_week_start()  # Sunday of this week

    # Determine which month this week belongs to
    month, year = get_month_for_week(week_start)
    month_key = f"{year}-{month:02d}"

    # Check if we've rolled into a new month
    if month_key != progress.month_year:
        # New month - reset monthly counters
        progress.qualifying_weeks_this_month = 0
        progress.wrapped_unlocked = False
        progress.total_responses_this_month = 0
        progress.total_work_days_this_month = 0
        progress.month_year = month_key

        # Check if practice mode should end
        if progress.is_practice_mode and month_key == progress.first_wrapped_month:
            progress.is_practice_mode = False

    # Get this week's stats (break days already excluded)
    completed, total_work_days, percentage = calculate_week_completion(user_id, week_start)

    # Check if week was entirely on break
    if percentage is None:
        # Entire week on break - streak pauses, week skipped
        # Do NOT reset streak, do NOT count toward qualifying weeks
        progress.current_week_responses = 0
        progress.current_week_start = get_next_week_start()
        save_user_progress(progress)
        return

    # Update monthly totals (for fallback calculation)
    progress.total_responses_this_month += completed
    progress.total_work_days_this_month += total_work_days

    if does_week_qualify(user_id, week_start):
        # Week qualified
        progress.current_week_streak += 1
        progress.last_qualifying_week_end = week_start + timedelta(days=6)

        # Count toward wrapped if not in practice mode
        if not progress.is_practice_mode:
            progress.qualifying_weeks_this_month += 1
    else:
        # Week did not qualify - streak breaks
        progress.current_week_streak = 0

    # Check if wrapped should unlock (either path)
    if not progress.is_practice_mode and not progress.wrapped_unlocked:
        progress.wrapped_unlocked = check_wrapped_unlock(progress)

    # Reset weekly counter
    progress.current_week_responses = 0
    progress.current_week_start = get_next_week_start()

    save_user_progress(progress)


def check_wrapped_unlock(progress):
    """
    Check if wrapped should unlock via either path.
    Path 1: 4+ qualifying weeks
    Path 2: 75%+ monthly responses (fallback)
    """
    # Path 1: Weekly qualifying weeks
    if progress.qualifying_weeks_this_month >= 4:
        return True

    # Path 2: Monthly fallback
    if progress.total_work_days_this_month > 0:
        monthly_percentage = (progress.total_responses_this_month /
                             progress.total_work_days_this_month) * 100
        if monthly_percentage >= 75:
            return True

    return False
```

### Handling New User Registration

```python
WEEKS_NEEDED_FOR_WRAPPED = 4

def initialize_new_user_progress(user_id, registration_date):
    """
    Set up progress tracking for new user.
    Determine if they're in practice mode based on weeks remaining in month.
    """
    weeks_remaining = count_weeks_remaining_in_month(registration_date)

    progress = UserFeedbackProgress(
        user_id=user_id,
        current_week_streak=0,
        qualifying_weeks_this_month=0,
        month_year=get_current_month_string(),
        wrapped_unlocked=False,
        current_week_responses=0,
        current_week_start=get_current_week_start(),
        account_created_date=registration_date
    )

    if weeks_remaining < WEEKS_NEEDED_FOR_WRAPPED:
        progress.is_practice_mode = True
        progress.first_wrapped_month = get_next_month_string()
    else:
        progress.is_practice_mode = False
        progress.first_wrapped_month = get_current_month_string()

    save_user_progress(progress)


def count_weeks_remaining_in_month(date):
    """
    Count how many complete weeks (ending Saturday) remain in the month.
    """
    weeks = 0
    check_date = get_next_saturday(date)

    while check_date.month == date.month:
        weeks += 1
        check_date += timedelta(days=7)

    return weeks
```

### Handling Schedule Changes

```python
def handle_schedule_change(user_id, new_work_days):
    """
    When user changes their work schedule.
    Current week re-evaluates with new schedule at week end.
    Past weeks keep their original evaluation.
    """
    update_user_settings(user_id, work_days=new_work_days)
    # No special handling needed - week end processing uses current settings
```

---

## UI States & Display Logic

### Screen Components (top to bottom)

1. **Thank You + Micro Action** (immediate reward for feedback)
2. **Weekly Streak Banner**
3. **Off Day Notice** (conditional - only on non-work days)
4. **This Week Progress** (work day dots)
5. **Monthly Wrapped Card** (three states)

### Weekly Streak Banner

Always displayed. Shows consecutive qualifying weeks.

```
Display: "🔥 {streak_count} week streak"
Subtext:
  - If streak == 1: "You're off to a great start!"
  - If streak > 1: "Keep it going!"
```

### Off Day Notice

Display only when current day is NOT in user's work_days.

```
Display: "📅 Work week resumes {next_work_day}"
Background: Amber (#FEF3C7)
Text: Amber dark (#92400E)
```

### This Week Progress Dots

Display one dot per work day in user's schedule. Always shows the user's full week of work days.

**Dot States:**
| State | Background | Icon |
|-------|------------|------|
| Completed | Teal (#4DB6AC) | ✓ (white) |
| Missed | Light red (#FEE2E2) | ✗ (red) |
| Future | Gray (#E5E7EB) | ○ (gray) |
| Current | Any above + dark border | Same |

**Footer text:** "Answer 75%+ of your work days to keep your streak"

### Monthly Wrapped Card States

**State 1: Practice Mode** (joined mid-month)
```
Icon: 🎯
Title: "Building Your First Wrapped"
Subtitle: "Keep your streak going! Your first Monthly Wrapped arrives {month} {day}."
Background: Light gray with border
```

**State 2: In Progress** (working toward 4 qualifying weeks)
```
Icon: 📊
Title: "{Month} Wrapped"
Progress: 4 segment bar showing qualifying_weeks_this_month filled
Subtitle: "{remaining} more to unlock"
Background: Light gray with border
```

**State 3: Unlocked**
```
Icon: 🎁
Title: "Monthly Wrapped Unlocked!"
Subtitle: "Your insights are ready to view"
Background: Solid teal (#4DB6AC)
Text: White
```

---

## API Endpoints

### GET /api/feedback-progress/{user_id}

Returns current state for UI rendering.

**Response:**
```json
{
  "week_streak": 4,
  "is_off_day": false,
  "next_work_day": "Mon",

  "this_week": {
    "work_days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
    "completed_days": ["Mon", "Tue", "Wed"],
    "current_day": "Wed",
    "completion_percentage": 60
  },

  "monthly_wrapped": {
    "status": "in_progress",
    "qualifying_weeks": 2,
    "weeks_needed": 4,
    "month_name": "December",
    "first_wrapped_date": null,
    "monthly_responses": 13,
    "monthly_work_days": 15,
    "monthly_percentage": 87
  }
}
```

**Status values:** `"practice_mode"` | `"in_progress"` | `"unlocked"`

**Note:** The `monthly_percentage` field can be used to show users they're on track for the fallback even if they miss a week. This is optional UI enhancement.

### POST /api/feedback-response

Called when user submits daily feedback. Increments current_week_responses.

---

## Edge Cases

### 1. User Changes Schedule Mid-Week

**Scenario:** User has 3 responses Mon-Wed on a 5-day schedule, then switches to 4-day.

**Handling:** Week evaluates against new schedule at week end. 3 of 4 = 75%, qualifies.

### 2. User Misses Entire Week After Qualifying Week

**Scenario:** User qualifies week 1, then misses all days in week 2.

**Handling:** Streak resets to 0. Qualifying weeks for month stays at 1. Monthly fallback still tracks total responses.

### 3. User Unlocks Wrapped Mid-Month

**Scenario:** User hits 4 qualifying weeks on December 20th.

**Handling:** Wrapped unlocks immediately. Streak continues. User can still lose streak but Wrapped stays unlocked for the month.

### 4. User Joins Late in Month

**Scenario:** User joins December 20th, only 2 weeks remain.

**Handling:** Practice mode. First wrapped = January 31st.

### 5. December 30th Response

**Scenario:** User responds on December 30th. Which month does it count toward?

**Handling:** The week of Dec 29 - Jan 4 ends on Saturday Jan 4, so it belongs to **January**. The response counts toward the user's January progress (both weekly and monthly totals).

### 6. Five-Week Month

**Scenario:** Month has 5 Saturdays (5 complete weeks).

**Handling:** User only needs 4 qualifying weeks. Extra opportunity makes it easier.

### 7. Streak Across Month Boundary

**Scenario:** User has 6-week streak spanning November to December.

**Handling:** Streak continues unbroken. Monthly qualifying weeks reset, but streak persists.

### 8. Vacation / Long Weekend (Monthly Fallback)

**Scenario:** User takes Thursday-Friday off in week 4. They responded 5/5, 5/5, 5/5, then 3/5.

**Handling:**
- Weekly path: Only 3 qualifying weeks (week 4 was 60%) -> Does not qualify
- Monthly fallback: 18/20 = 90% -> **Qualifies**
- Wrapped unlocks via fallback
- Streak breaks at week 4 (this is the trade-off for the vacation)

### 9. Sick Days Spread Across Month

**Scenario:** User misses 1 day per week for 4 weeks (sick days, appointments, etc.). On a 5-day schedule, they respond 4/5 each week.

**Handling:**
- Weekly path: 4 qualifying weeks (80% each) -> **Qualifies**
- No fallback needed
- Streak continues

This is why 75% threshold works well. It absorbs normal life disruptions.

### 10. Borderline Monthly Fallback

**Scenario:** User responds exactly 15/20 days (75.0%).

**Handling:** Meets the 75% threshold. Wrapped unlocks via fallback.

### 11. Partial Week Break (Thu-Fri Off)

**Scenario:** 5-day worker sets Thu-Fri as break. Responds Mon-Tue-Wed.

**Handling:**
- Available days: 3 (Mon, Tue, Wed)
- Responses: 3
- Percentage: 100%
- Week qualifies, streak preserved

### 12. Full Week Break

**Scenario:** User sets entire week as break (vacation).

**Handling:**
- Available days: 0
- Week is skipped entirely
- Streak pauses (6-week streak stays at 6)
- Week does not count toward qualifying weeks
- Week does not count toward monthly totals

### 13. Two-Week Break in 4-Week Month

**Scenario:** User takes 2 weeks off in a month that only has 4 weeks.

**Handling:**
- Only 2 qualifying opportunities remain
- Cannot reach 4 qualifying weeks
- Monthly fallback: If user responds 100% on the 2 active weeks (10/10 days), that's 100% of available days
- **Wrapped unlocks via fallback**

### 14. Break Set After Missing Days

**Scenario:** User misses Mon-Tue, then retroactively sets them as break days.

**Handling:** This is a product decision. Options:
- **Option A (Strict):** Break must be set in advance. Retroactive changes don't affect past calculations.
- **Option B (Forgiving):** Allow retroactive break setting. Recalculate the week.

Recommendation: Option A. Otherwise users could "game" the system by marking missed days as break after the fact.

### 15. Break Overlaps Month Boundary

**Scenario:** User sets break Dec 28 - Jan 3. The week of Dec 29 - Jan 4 belongs to January.

**Handling:**
- All break days in that week are excluded from January's calculations
- If entire week is on break, January's first week is skipped
- December is unaffected (week already belongs to January)

---

## Scheduled Jobs

### Weekly Job (Saturday 11:59 PM user's timezone)

```
For each active user:
  1. Determine which month the ending week belongs to
  2. If new month, reset monthly counters
  3. Calculate if current week qualifies (75%+)
  4. Update streak (increment or reset to 0)
  5. Update qualifying_weeks_this_month
  6. Check wrapped unlock condition
  7. Reset current_week_responses
```

---

## Color Reference (Clover ERA Brand)

| Element | Hex |
|---------|-----|
| Primary teal | #4DB6AC |
| Dark teal (headers) | #3D9A91 |
| Body text | #2D4A47 |
| Muted text | #6B7280 |
| Dividers | #E5E7EB |
| Card backgrounds | #F9FAFB |
| Completed dot | #4DB6AC |
| Missed dot background | #FEE2E2 |
| Missed dot icon | #EF4444 |
| Future dot | #E5E7EB |
| Off day notice background | #FEF3C7 |
| Off day notice text | #92400E |

---

## Testing Scenarios

### Required Test Cases

1. **New user, full month available** - Not in practice mode
2. **New user, 2 weeks remaining** - Practice mode activated
3. **4-day schedule, 3 responses** - Should qualify (75%)
4. **5-day schedule, 3 responses** - Should NOT qualify (60%)
5. **6-day schedule, 4 responses** - Should NOT qualify (66%)
6. **Schedule change mid-week** - Re-evaluates at week end
7. **Streak at 5, miss entire week** - Streak resets to 0
8. **4 qualifying weeks reached** - Wrapped unlocks via weekly path
9. **Week spanning month boundary** - Belongs to month of Saturday
10. **Off day detection** - Shows correct "resumes" day
11. **Practice mode to normal transition** - Happens at first_wrapped_month
12. **Five-week month** - Only 4 weeks needed
13. **Streak persists across month boundary** - Doesn't reset with month
14. **Vacation fallback - 3 qualifying weeks + 90% monthly** - Wrapped unlocks via fallback
15. **Vacation fallback - 3 qualifying weeks + 70% monthly** - Wrapped does NOT unlock
16. **Exactly 75% monthly** - Wrapped unlocks (boundary test)
17. **Monthly totals reset on new month** - Counters reset correctly
18. **Fallback calculated correctly with variable schedules** - 4-day and 6-day users
19. **Partial week break (Thu-Fri)** - Week calculated as 3/3, qualifies
20. **Full week break** - Week skipped, streak pauses (not reset)
21. **Full week break mid-streak** - Streak of 6, break week, then qualify = streak becomes 7
22. **Two weeks break in 4-week month** - Only 2 opportunities, fallback applies
23. **Break days excluded from monthly totals** - Fallback uses only active days
24. **Break spanning month boundary** - Correctly attributed to proper month

---

## Summary

The system is simple:

1. **Users respond daily** on their configured work days
2. **Each week (Sun-Sat) evaluates** at 75% threshold
3. **Qualifying weeks increment streak** and count toward monthly wrapped
4. **Wrapped unlocks** if user has 4 qualifying weeks OR 75%+ monthly responses
5. **Weeks belong to the month containing Saturday** (no partial weeks)
6. **Mid-month joiners enter practice mode** until next month
7. **"Take a break" excludes days from calculations** and pauses (not breaks) streaks

The monthly fallback ensures unplanned absences don't prevent users from earning their Wrapped. The "take a break" feature handles planned time off cleanly, preserving both streak and wrapped progress.

User-facing message: **"Preserve your weekly streaks (75%+) and receive your monthly wrapped insights."**

---

## Appendix: UI Component Mockups

See accompanying React component file `feedback-progress-all-scenarios.jsx` for interactive mockups demonstrating all states.

---

*Document prepared for development team. For questions, contact product team.*
