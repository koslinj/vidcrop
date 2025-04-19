
# Flyway PostgreSQL Initialization in Minikube

## Setup
Starting postgres service:
```bash
kubectl apply -f /vidcrop/postgres/manifests
```

## Running the Flyway Job
**Flyway Job**: Runs database migrations on PostgreSQL. It uses credentials from secrets and database info from a ConfigMap.

Before running the Flyway job, generate the `flyway-sql` ConfigMap from your SQL migration files:
```bash
kubectl create configmap flyway-sql --from-file=sql/
```
Then apply the job:
```bash
kubectl apply -f flyway-job.yaml
```
Check the status:
```bash
kubectl get jobs
kubectl logs job/flyway-init
```

## Testing

To verify the `users` table:
1. Connect to the PostgreSQL pod:
   ```bash
   kubectl exec -it <postgres-pod-name> -- psql -U user -d auth
   ```
2. Run: 
   ```sql
   SELECT * FROM users;
   ```
