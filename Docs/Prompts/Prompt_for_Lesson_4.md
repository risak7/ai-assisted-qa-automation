Write Playwright tests for creating a new program on Didaxis Studio.
## App context (from manual inspection)
- Login page: [https://test.didaxis.studio/login](https://test.didaxis.studio/login)
  - Email field: getByLabel('Email') or by type : type= "email"
  - Password field: getByLabel('Password') or by placeholder="Your password"
  - Sign In button: getByRole('button', { name: 'Sign In' })
- Programs page: /programs
  - "New Program" button: getByRole('button', { name: '+ New Program' })
  - Modal form:
    - Program Name: getByLabel('Program Name')
    - Description: getByLabel('Description')
    - Create button: getByRole('button', { name: 'Create' })
## Credentials
Use dotenv. Read email and password from process.env:
- process.env.DIDAXIS_EMAIL
- process.env.DIDAXIS_PASSWORD
Do NOT hardcode credentials in the test file.
## Test plan
@DS-2_output.md 
@DS-3_output.md
@DS-4_output.md
@DS-5_output.md

## Requirements
- TypeScript
- Use Playwright locators (getByRole, getByLabel, getByText)
- Login as the first step in each test (or use beforeEach)
- Each test is independent
- Use unique test data with Date.now() suffix
- Save as 
tests/ds2-create-program.spec.ts
tests/ds3-create-program.spec.ts
tests/ds4-create-program.spec.ts
tests/ds5-create-program.spec.ts

After creating all the test cases above, run them on chrome only, check the results, fix tests if test result doesn't match the result from real app