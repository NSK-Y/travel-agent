# Run this once to create your .env file from the template
Copy-Item .env.example .env
Write-Host "✅ .env created. Open it and paste your WATSONX_API_KEY."
Start-Process notepad .env
