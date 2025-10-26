import { beforeAll } from 'vitest'
import { setProjectAnnotations } from '@storybook/react-vite'

const annotations = setProjectAnnotations([])

beforeAll(annotations.beforeAll)
