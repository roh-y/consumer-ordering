import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders the navigation', () => {
    render(<App />)
    expect(screen.getByText('Wireless Plans')).toBeInTheDocument()
  })

  it('shows the plans page by default', () => {
    render(<App />)
    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument()
  })

  it('displays all plan cards', () => {
    render(<App />)
    expect(screen.getByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('Standard')).toBeInTheDocument()
    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('Unlimited Plus')).toBeInTheDocument()
  })
})
