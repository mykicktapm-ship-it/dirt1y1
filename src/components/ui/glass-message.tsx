"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import styles from "./glass-message.module.scss";

/* Glass chat messages. The glass is plain SCSS on --glass-* variables, dark values only,
   since the site's stages are dark. */

type MessageFrom = "user" | "assistant";

const MessageContext = React.createContext<{ from: MessageFrom }>({ from: "assistant" });

/** A column of messages. */
function GlassMessageList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="glass-message-list"
      role="log"
      aria-live="polite"
      className={cn(styles.list, className)}
      {...props}
    />
  );
}

/** One message: `user` on the right in a tinted bubble, `assistant` on the left on frosted glass. */
function GlassMessage({
  from = "assistant",
  avatar,
  name,
  footer,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  from?: MessageFrom;
  /** An image URL, initials, or any node. */
  avatar?: React.ReactNode;
  /** Sender name above the bubble. */
  name?: React.ReactNode;
  /** Meta under the bubble, e.g. a time or "Read". */
  footer?: React.ReactNode;
}) {
  return (
    <MessageContext.Provider value={{ from }}>
      <div
        data-slot="glass-message"
        data-from={from}
        className={cn(styles.message, className)}
        {...props}
      >
        {avatar !== undefined ? <GlassMessageAvatar>{avatar}</GlassMessageAvatar> : null}
        <div className={styles.stack}>
          {name ? <span className={styles.name}>{name}</span> : null}
          {children}
          {footer ? <span className={styles.footer}>{footer}</span> : null}
        </div>
      </div>
    </MessageContext.Provider>
  );
}

function GlassMessageAvatar({ className, children, ...props }: React.ComponentProps<"span">) {
  const src =
    typeof children === "string" && /^(https?:|\/|data:)/.test(children) ? children : null;
  return (
    <span data-slot="glass-message-avatar" className={cn(styles.avatar, className)} {...props}>
      {src ? <img src={src} alt="" /> : children}
    </span>
  );
}

/** The bubble. Several in a row read as one group. */
function GlassMessageContent({ className, ...props }: React.ComponentProps<"div">) {
  const { from } = React.useContext(MessageContext);
  return (
    <div
      data-slot="glass-message-content"
      data-from={from}
      className={cn(styles.glass, styles.content, className)}
      {...props}
    />
  );
}

/** Three bouncing dots while the other side is typing. */
function GlassMessageTyping({ className, ...props }: React.ComponentProps<"output">) {
  return (
    <output
      data-slot="glass-message-typing"
      aria-label="Typing"
      className={cn(styles.glass, styles.typing, className)}
      {...props}
    >
      {[0, 1, 2].map((index) => (
        <span key={index} style={{ animationDelay: `${index * 0.16}s` }} />
      ))}
    </output>
  );
}

export {
  GlassMessage,
  GlassMessageAvatar,
  GlassMessageContent,
  GlassMessageList,
  GlassMessageTyping,
  type MessageFrom,
};

export default GlassMessage;
