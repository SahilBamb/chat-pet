function UserMessage({ message, index, userId, incrementScore }) {
  return (
    <div
      className={`message ${message.userId === userId ? "own" : ""}`}
      onClick={() => incrementScore(index)}
    >
      <img className="messageItem" src={message.imageId.image.avatar} alt="React Logo" />
      <div className="messageText">{message.text}</div>
      {message.score > 0 && (
        <MessageScore score={message.score} />
      )}
    </div>
  );
} 