- Role in the staff table should be RANK and status Should be DEPARTMENT
- The Recommended  Retirement Date should be "Proposed  Retirement byAge
- while the new column in the Staff table should be "proposed retirement by Appt"

### [DO THIS FIRST] Then the four new additionals which are not tied to any LGA are:
 - Local Govt. Service Commission (LGSC)
 - Benin Traditional Council (BTC)
 - Local Govt. Staff Training School, Bekuma (LGSTS)
 - Local Govt. Staff Pension Board (LGSPB)

### formulas:
    - Proposed Retirement by Age =EDATE(dateOfBirth,12*60)
    - Proposed Retirement by Appt. =EDATE(dateOfFirstAppt,12*35)


## Implement Retirement Date Calculations in PostgreSQL

Implement automatic retirement date calculations using PostgreSQL date arithmetic.

### Business Rules

Each employee has two proposed retirement dates:

**1. Proposed Retirement by Age**
- Based on the employee's `date_of_birth`.
- Retirement age is 60 years.
- Equivalent Excel formula: `=EDATE(dateOfBirth, 12*60)`.
- PostgreSQL equivalent: `date_of_birth + INTERVAL '60 years'`.

**2. Proposed Retirement by Appointment**
- Based on the employee's `date_of_first_appointment`.
- Retirement period is 35 years from the first appointment date.
- Equivalent Excel formula: `=EDATE(dateOfFirstAppt, 12*35)`.
- PostgreSQL equivalent: `date_of_first_appointment + INTERVAL '35 years'`.

### Implementation Requirements

1. Implement these calculations at the database/backend level, not just in the frontend.
2. Use PostgreSQL date arithmetic or `make_interval()` for accurate date calculations.
3. Ensure the calculations handle leap years and month-end dates correctly.
4. Return both calculated dates whenever employee records are retrieved.
5. Handle NULL values: if either source date is missing, its corresponding retirement date should return NULL.
6. Do not store redundant calculated values unless there is a specific architectural reason. Prefer computed values in database queries or a database view.
7. Use DATE types rather than timestamps where only calendar dates are required.

### Additional Business Logic

If both retirement dates are available, determine the earlier date as the proposed effective retirement date.

Expose the following fields in the employee response:

- `retirement_by_age`
- `retirement_by_appointment`
- `proposed_retirement_date`

Ensure the implementation is consistent across the API, database queries, and frontend.
