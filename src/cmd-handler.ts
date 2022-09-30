import amqplib from "amqplib";
import { config } from "./_config";
import { v4 as uuid } from "uuid";

let amqpConnection: amqplib.Connection;
let amqpConnectionChannel: amqplib.Channel;

const setupAmqpConnection = async () => {
  amqpConnection = await amqplib.connect(config.amqpServerUri);
  amqpConnectionChannel = await amqpConnection.createChannel();
  await amqpConnectionChannel.assertQueue(config.mainQueueName);
  console.log(`[cmd-handler] Connected to amqp broker.`);
};

const handleCommand = async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    cmdId: uuid(),
    shippingId: uuid(),
  };
};

const sendResultToSender = async (originalMsg: amqplib.Message, cmdResult: unknown) => {
  amqpConnectionChannel.sendToQueue(
    originalMsg.properties.replyTo,
    Buffer.from(JSON.stringify(cmdResult)),
    {
      correlationId: originalMsg.properties.correlationId,
    }
  );
  console.log(`[cmd-handler] Command handled. Response sent: ${JSON.stringify(cmdResult)}`);
  await amqpConnectionChannel.ack(originalMsg);
};

(async () => {
  await setupAmqpConnection();

  await amqpConnectionChannel!.consume(config.mainQueueName, async (cmdRequestMsg) => {
    if (!cmdRequestMsg) return;
    const msgContent = JSON.parse(cmdRequestMsg.content.toString("utf8"));

    console.log(`[cmd-handler] Command received. ${JSON.stringify(msgContent)}. Handling.`);

    const cmdResult = await handleCommand();

    await sendResultToSender(cmdRequestMsg, cmdResult);
  });
})();
