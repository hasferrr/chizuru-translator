# API docs

Translation

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-3ZGL9biaBRXpsqNkUk5HUNyH" \
  -d '{
    "subtitles": [
      {"index": 5, "actor": "Alice", "content": "Hello chat."},
      {"index": 6, "actor": "Bob", "content": "Yo whats going on."}
    ],
    "sourceLanguage": "english",
    "targetLanguage": "indonesian",
    "contextDocument": "",
    "baseURL": "https://api.deepseek.com",
    "model": "deepseek-reasoner",
    "temperature": 0.6,
    "maxCompletionTokens": 8129,
    "contextMessage": [
      {
        "role": "user",
        "content": [
          { "index": 1, "actor": "", "content": "L-Lust!" },
          { "index": 2, "actor": "", "content": "Oh, I shouldve known." },
          { "index": 3, "actor": "", "content": "Your blood just couldnt  \\n beat mine, could it?" },
          { "index": 4, "actor": "", "content": "And yours seemed to be quite noble, too." }
        ]
      },
      {
        "role": "assistant",
        "content": [
          { "index": 1, "translated": "N-Nafsu!", "content": "L-Lust!" },
          { "index": 2, "translated": "Oh, seharusnya aku tahu.", "content": "Oh, I shouldve known." },
          { "index": 3, "translated": "Darahmu tidak bisa mengalahkan milikku, kan?", "content": "Your blood just couldnt  \\n beat mine, could it?" },
          { "index": 4, "translated": "Dan milikmu tampaknya cukup mulia juga.", "content": "And yours seemed to be quite noble, too." }
        ]
      }
    ]
  }' \
  http://localhost:4000/api/stream/translate
```

Context Extraction

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-3ZGL9biaBRXpsqNkUk5HUNyH" \
  -d '{
    "input": {
      "episode": "1",
      "previous_context": "",
      "subtitles": [
        {"index": 1, "actor": "Alice", "content": "Hello chat."},
        {"index": 2, "actor": "Bob", "content": "Yo whats going on."}
      ]
    },
    "baseURL": "https://api.deepseek.com",
    "model": "deepseek-reasoner",
    "temperature": 0.2,
    "maxCompletionTokens": 8129,
    "partial": false
  }' \
  http://localhost:4000/api/stream/extract-context
```
