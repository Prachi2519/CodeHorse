"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SubscriptionPage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Subscription controls will appear here.
      </CardContent>
    </Card>
  );
};

export default SubscriptionPage;
