import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScoreBadge } from './ScoreBadge'

const meta = {
  title: 'Risk/ScoreBadge',
  component: ScoreBadge,
  args: { score: 42 },
  argTypes: { score: { control: { type: 'range', min: 0, max: 100, step: 1 } } },
} satisfies Meta<typeof ScoreBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {}

export const Bands: Story = {
  render: () => (
    <div className="flex gap-2">
      <ScoreBadge score={12} />
      <ScoreBadge score={55} />
      <ScoreBadge score={91} />
    </div>
  ),
}
