export default function ChatHome() {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="text-center p-8">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Select a user to start chatting
        </h2>
        <p className="text-muted-foreground text-sm">
          Choose a contact from the sidebar to begin your conversation
        </p>
      </div>
    </div>
  );
}
