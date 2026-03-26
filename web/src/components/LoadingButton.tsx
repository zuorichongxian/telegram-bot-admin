import type { ComponentProps, ReactNode } from "react";

import { Button, Spinner } from "@heroui/react";

type LoadingButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

export function LoadingButton({
  loading = false,
  loadingLabel = "处理中...",
  children,
  isDisabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} isDisabled={isDisabled || loading}>
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner className="size-4" />
          {loadingLabel}
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
