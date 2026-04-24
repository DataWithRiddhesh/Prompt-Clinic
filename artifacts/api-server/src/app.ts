import express from 'express'
import { Request, Response } from 'express'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'MediSync API running' })
})

app.get('/api/patients', (req: Request, res: Response) => {
  res.json({ patients: [] })
})

app.post('/api/patients', (req: Request, res: Response) => {
  res.json({ success: true })
})

app.get('/api/appointments', (req: Request, res: Response) => {
  res.json({ appointments: [] })
})

app.post('/api/appointments', (req: Request, res: Response) => {
  res.json({ success: true })
})

app.get('/api/reminders', (req: Request, res: Response) => {
  res.json({ reminders: [] })
})

app.post('/api/reminders', (req: Request, res: Response) => {
  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app