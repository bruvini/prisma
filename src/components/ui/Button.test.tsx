import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';


describe('Button Component', () => {
  it('renders correctly with given children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeDefined();
  });

  it('shows loading spinner when isLoading is true', () => {
    const { container } = render(<Button isLoading>Click Me</Button>);
    expect(container.querySelector('.spinner')).not.toBeNull();
  });
});
