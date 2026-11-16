import preview from '../../.storybook/preview'
import { fn } from 'storybook/test'

import { Button } from './Button'

const meta = preview.meta({
  title: 'Example/Button',
  component: Button,
  argTypes: {
    backgroundColor: { control: 'color' },
    // onClick: fn
  },
  tags: [],
})

export const Primary = meta.story({
  args: {
    primary: true,
    label: 'Button',
    onClick: fn().mockName('clicked'),
  },
})

export const Secondary = meta.story({
  args: {
    label: 'Button',
  },
})

export const Large = meta.story({
  args: {
    size: 'large',
    label: 'Button',
  },
})

export const Medium = meta.story({
  args: {
    size: 'medium',
    label: 'Button',
  },
})

export const MediumSizeButton = meta.story({
  args: {
    size: 'medium',
    label: 'Button',
  },
  tags: ['deprecated'],
})

export const Small = meta.story({
  args: {
    size: 'small',
    label: 'Button',
  },
})
