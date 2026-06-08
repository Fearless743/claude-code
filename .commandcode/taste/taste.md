# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# login
- /login should only require Base URL and API Key (no additional fields). Confidence: 0.75

# model
- /model should fetch available models from baseURL + /v1/models endpoint. Confidence: 0.75
- Display model names directly in model selection instead of wrapping them in "Default (recommended)" labels. Confidence: 0.70

# rust-workflow
- Make actual code changes first before running cargo check/test/fmt to verify. Avoid verification loops without progress. Confidence: 0.65

# git
- Commit changes to git after each meaningful code modification. Confidence: 0.85

