import amqplib from "amqplib";
import { config } from "./_config";
import { v4 as uuid } from "uuid";

(async () => {
  const connection = await amqplib.connect(config.amqpServerUri);
  const channel = await connection.createChannel();
  await channel.assertQueue(config.mainQueueName);

  console.log(`[cmd-handler] Connected to amqp broker.`);

  await channel.consume(config.mainQueueName, async (msg) => {
    if (!msg) return;
    const msgContent = JSON.parse(msg.content.toString("utf8"));

    console.log(`[cmd-handler] Command received. ${JSON.stringify(msgContent)}. Handling.`);

    // Fake command handling
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const cmdResult = {
      cmdId: uuid(),
      shippingId: uuid(),
    };

    channel.sendToQueue(msg.properties.replyTo, Buffer.from(JSON.stringify(cmdResult)), {
      correlationId: msg.properties.correlationId,
    });
    console.log(`[cmd-handler] Command handled. Response sent: ${JSON.stringify(cmdResult)}`);

    await channel.ack(msg);
  });
})();
