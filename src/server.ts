import app from './app/app'

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
