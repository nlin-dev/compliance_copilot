'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import sampleNotes from '@/../../data/sample-visit-notes.json'

interface SampleNote {
  id: string
  name: string
  description: string
  expectedStatus: string
  visitNote: string
}

interface ExampleSelectorProps {
  onSelect: (noteText: string) => void
  disabled?: boolean
}

const typedSampleNotes = sampleNotes as SampleNote[]

export function ExampleSelector({ onSelect, disabled }: ExampleSelectorProps) {
  const handleValueChange = (noteId: string) => {
    const selectedNote = typedSampleNotes.find((note) => note.id === noteId)
    if (selectedNote) {
      onSelect(selectedNote.visitNote)
    }
  }

  return (
    <Select onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Choose an example..." />
      </SelectTrigger>
      <SelectContent>
        {typedSampleNotes.map((note) => (
          <SelectItem key={note.id} value={note.id}>
            {note.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
