import { ShellLayout } from "@/components/layout/ShellLayout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export default function HomePage() {
  return (
    <ShellLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">
              Welcome to Dori.ai
            </h1>
            <p className="mt-1 text-ink-600 text-sm">
              AI-powered clinical documentation assistant
            </p>
          </div>
          <Avatar initials="DR" size="md" />
        </div>

        {/* Design system demo */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-ink-900">
                Design System
              </h2>
              <Badge variant="success">Ready</Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="space-y-6">
              {/* Badge variants */}
              <div>
                <p className="text-sm font-medium text-ink-600 mb-3">
                  Status badges
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Session complete</Badge>
                  <Badge variant="warning">Review needed</Badge>
                  <Badge variant="error">High risk</Badge>
                  <Badge variant="info">In progress</Badge>
                  <Badge variant="neutral">Draft</Badge>
                </div>
              </div>

              {/* Button variants */}
              <div>
                <p className="text-sm font-medium text-ink-600 mb-3">
                  Button variants
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Generate Note</Button>
                  <Button variant="secondary">View Session</Button>
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="danger">Delete</Button>
                  <Button variant="primary" isLoading>
                    Saving...
                  </Button>
                </div>
              </div>

              {/* Avatar row */}
              <div>
                <p className="text-sm font-medium text-ink-600 mb-3">
                  Avatars
                </p>
                <div className="flex items-center gap-3">
                  <Avatar initials="AB" size="sm" />
                  <Avatar initials="CD" size="md" />
                  <Avatar initials="EF" size="lg" />
                </div>
              </div>
            </div>
          </Card.Body>
          <Card.Footer>
            <p className="text-xs text-ink-400">
              All tokens sourced from the Dori.ai UI Design System spec
            </p>
          </Card.Footer>
        </Card>
      </div>
    </ShellLayout>
  );
}
