export const config = {
  amqpServerUri: "amqp://guest:guest@localhost:5672",
  mainQueueName: "commands",
  replyToQueueName: "amq.rabbitmq.reply-to",
};
