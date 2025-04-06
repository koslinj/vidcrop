# Accessing RabbitMQ Console

To access the RabbitMQ management console, follow these steps:

1. **Port Forward to Localhost:**
   Run the following command to forward the RabbitMQ service port (15672) to your local machine:

   ```bash
   kubectl port-forward svc/rabbitmq-service 15672:15672
   ```

   This command will forward port 15672 of the RabbitMQ service to port 15672 on your localhost.

2. **Open the Management Console:**
   After the port forwarding is set up, open your web browser and navigate to the following URL:

   ```
   http://localhost:15672
   ```

3. **Login to RabbitMQ:**
   The default credentials are:
   - **Username:** `guest`
   - **Password:** `guest`

   You can change these credentials through your RabbitMQ configuration if needed.

---

This allows you to access the RabbitMQ management console and manage your queues, exchanges, and bindings directly from your browser.
