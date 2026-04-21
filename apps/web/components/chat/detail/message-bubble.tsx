interface Props {
  type: "user" | "ai";
  content: string;
}

const classNames = {
  user: "text-[#8D1620] bg-[#FFC3C0] rounded-lg rounded-br-none p-[32px]",
  ai: "text-[#4A356F] bg-[#D4BBFF] rounded-lg rounded-bl-none p-[32px]",
};

export const MessageBubble = ({ type, content }: Props) => {
  return (
    <div
      className={`${type === "user" ? "justify-end" : "justify-start"} flex mb-2`}
    >
      <div className={`${classNames[type]}`}>{content}</div>
    </div>
  );
};
