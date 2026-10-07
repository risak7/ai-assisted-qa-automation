1. Read ticket DS-2 from Jira — get the title and acceptance criteria
2. Using Playwright MCP, navigate to https://test.didaxis.studio,
   log in with the credentials from .env, and explore the Programs page
3. Based on the Jira ACs and what you found on the actual page,
   update my existing test cases in @Test Cases/DS-2 
   — fix anything that doesn't match the real app, add any missing
   edge cases you discovered from the page
4. Generate Playwright tests based on the updated test cases: [@ds2-create-program.spec.ts] 
   — use dotenv for credentials, use the real locators from MCP
   — save as [tests/ds2-create-program.spec.ts]
## Prompt template
C:\GIT\Legion\Automation\ai-assisted-qa-automation\Docs\Prompts\Prompt_for_lesson_2.md