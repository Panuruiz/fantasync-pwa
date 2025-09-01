import type { Meta, StoryObj } from '@storybook/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';
import { Button } from './button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'w-[350px]',
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description goes here</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here. You can add any content you want.</p>
        </CardContent>
        <CardFooter>
          <Button>Action</Button>
        </CardFooter>
      </>
    ),
  },
};

export const SimpleCard: Story = {
  args: {
    className: 'w-[350px]',
    children: (
      <>
        <CardHeader>
          <CardTitle>Simple Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a simple card with just a title and content.</p>
        </CardContent>
      </>
    ),
  },
};

export const GameCard: Story = {
  args: {
    className: 'w-[350px]',
    children: (
      <>
        <CardHeader>
          <CardTitle>D&D Campaign</CardTitle>
          <CardDescription>Lost Mines of Phandelver</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Master:</strong> John Doe
            </p>
            <p className="text-sm">
              <strong>Players:</strong> 4/5
            </p>
            <p className="text-sm">
              <strong>Next Session:</strong> Saturday 8PM
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">View Details</Button>
          <Button>Join Game</Button>
        </CardFooter>
      </>
    ),
  },
};

export const CharacterCard: Story = {
  args: {
    className: 'w-[300px]',
    children: (
      <>
        <CardHeader>
          <CardTitle>Aragorn</CardTitle>
          <CardDescription>Level 5 Human Ranger</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>HP:</strong> 45/45
            </div>
            <div>
              <strong>AC:</strong> 16
            </div>
            <div>
              <strong>STR:</strong> 16 (+3)
            </div>
            <div>
              <strong>DEX:</strong> 14 (+2)
            </div>
            <div>
              <strong>CON:</strong> 13 (+1)
            </div>
            <div>
              <strong>INT:</strong> 11 (+0)
            </div>
            <div>
              <strong>WIS:</strong> 13 (+1)
            </div>
            <div>
              <strong>CHA:</strong> 10 (+0)
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">View Character Sheet</Button>
        </CardFooter>
      </>
    ),
  },
};