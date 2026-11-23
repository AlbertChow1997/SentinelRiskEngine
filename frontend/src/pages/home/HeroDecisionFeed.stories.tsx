import type { Meta, StoryObj } from '@storybook/react-vite'
import { HeroDecisionFeed } from './HeroDecisionFeed'

const meta = {
  title: 'Home/HeroDecisionFeed',
  component: HeroDecisionFeed,
} satisfies Meta<typeof HeroDecisionFeed>

export default meta
type Story = StoryObj<typeof meta>

/** Rotates every 2.6 s; use the Pause button, or enable reduced motion in the OS to see it static. */
export const Default: Story = {}
