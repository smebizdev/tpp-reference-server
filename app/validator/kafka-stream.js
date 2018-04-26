const Kafka = require('no-kafka');

class RoundRobinPartitioner extends Kafka.DefaultPartitioner {
  partition(topicName, partitions, message) { // eslint-disable-line
    if (this.counter < 0 || this.counter >= partitions.length) {
      this.counter = 0;
    }
    const curIndex = this.counter;
    this.counter = this.counter + 1;
    return curIndex;
  }
}

const createKafkaProducer = async (options) => {
  const opts = Object.assign({ partitioner: new RoundRobinPartitioner() }, options);
  const producer = new Kafka.Producer(opts);
  await producer.init();
  return producer;
};

class KafkaStream {
  constructor({ topic, kafkaOpts }) {
    if (!kafkaOpts) {
      throw new Error('Kafka options must be provided');
    }
    if (!topic) {
      throw new Error('KafkaStream must have a topic');
    }
    this.topic = topic;
    this.kafkaOpts = kafkaOpts;
  }

  async init() {
    const producer = await createKafkaProducer(this.kafkaOpts);
    this.producer = producer;
    return this;
  }

  async write(record) {
    const value = JSON.stringify(record);
    try {
      const messageSet = await this.producer.send({
        topic: this.topic,
        message: { value },
      });
      messageSet.filter(r => r.error).forEach((r) => {
        throw r.error;
      });
    } catch (err) {
      throw err;
    }
  }
}

exports.KafkaStream = KafkaStream;
exports.RoundRobinPartitioner = RoundRobinPartitioner;
