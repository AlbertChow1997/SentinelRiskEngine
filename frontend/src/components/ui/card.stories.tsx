import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'

const meta = {
  title: 'UI/Card',
  component: Card,
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const ProductCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Risk Engine</CardTitle>
        <CardDescription>Rules and a machine-learning score on every payment.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        Each decision lists the rules that fired and the top model factors.
      </CardContent>
      <CardFooter>
        <Button variant="link" className="px-0">
          Learn more
        </Button>
      </CardFooter>
    </Card>
  ),
}
