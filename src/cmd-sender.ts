import amqp from "amqplib";
import EventEmitter from "events";
import { v4 as uuid } from "uuid";
import { config } from "./_config";

const responseEmitter = new EventEmitter();

const sendRPCMessage = (
  channel: amqp.Channel,
  message: string,
  rpcQueue: string
) =>
  new Promise((resolve) => {
    const correlationId = uuid();
    responseEmitter.once(correlationId, resolve);
    channel.sendToQueue(rpcQueue, Buffer.from(message), {
      correlationId,
      replyTo: config.replyToQueueName,
    });
    console.log(`[cmd-sender] Command sent. Waiting for response.`);
  });

(async () => {
  const connection = await amqp.connect(config.amqpServerUri);
  const channel = await connection.createChannel();
  responseEmitter.setMaxListeners(0);

  console.log(`[cmd-sender] Connected to amqp broker.`);
  console.log(`[cmd-sender] Consuming reply-to queue.`);
  await channel.consume(
    config.replyToQueueName,
    (msg) => {
      if (msg) {
        responseEmitter.emit(
          msg.properties.correlationId,
          msg.content.toString("utf8")
        );
      }
    },
    { noAck: true }
  );

  const cmdName = "shipOrderCmd";
  const cmdPayload = { orderId: uuid() };

  const response = await sendRPCMessage(
    channel,
    JSON.stringify({ cmdName, cmdPayload }),
    config.mainQueueName
  );

  console.log(`[cmd-sender] Received the command response: ${response}`);
})();
