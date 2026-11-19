import type { Preview } from '@storybook/react-vite'
import '../src/styles/index.css'

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i } },
    // Fail the a11y panel on any axe violation instead of only warning.
    a11y: { test: 'error' },
  },
}

export default preview
