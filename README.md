# vidcrop

## 🛠️ Installation (WSL + Docker + Minikube)

### 1. ✅ Enable WSL and Install Ubuntu
Open PowerShell as Administrator and run:

```powershell
wsl --install
```

### 2. 🐳 Install Docker (for WSL)
- Download and install **[Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)**  
- In Docker settings:
  - Enable **"Use the WSL 2 based engine"**
  - Go to **Resources > WSL Integration** and enable Docker for your Ubuntu distribution

After installation, test Docker inside WSL:

```bash
docker run hello-world
```

### 3. ❌ Fix Docker Permission Denied Error
If you get this error:

```
docker: permission denied while trying to connect to the Docker daemon socket
```

Run the following command to add your user to the Docker group:

```bash
sudo usermod -aG docker $USER
```

Then restart the WSL session and test again:

```bash
docker run hello-world
```

It should now work!

### 4. 📦 Install Minikube (WSL with Docker driver)
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

Verify installation:

```bash
minikube version
```

### 5. 🚀 Start Minikube with Mounted Volume
Make sure Docker Desktop is running.

Start Minikube with your local folder mounted into the cluster:

```bash
minikube start --driver=docker --mount --mount-string="/mnt/c/Users/<your-user>/Desktop/vidcrop-volume:/vidcrop-volume-minikube"
```

---

## 🚀 Running and Deploying the Project

Once your environment is set up, follow these steps to build Docker images and deploy your Kubernetes setup using Minikube.

### 1. 🔄 Use Minikube Docker Daemon
Run the following command to point your terminal to use the Docker daemon inside Minikube:

```bash
eval $(minikube docker-env)
```

This ensures that Docker images you build are accessible to your Minikube cluster.

### 2. 🏗️ Build Docker Images
Navigate to your project directories and build the images:

```bash
cd vidcrop/storage
docker build -t storage .

cd vidcrop/gateway
docker build -t vidcrop-gateway .
```

### 3. ⚙️ Enable Ingress Addon in Minikube
```bash
minikube addons enable ingress
```

This enables the NGINX ingress controller for routing traffic inside the cluster.

### 4. 📝 Add Host Mapping (Windows)
Open this file in Notepad as Administrator:

```
C:\Windows\System32\drivers\etc\hosts
```

Add this line to the bottom:

```
127.0.0.1    vidcrop.com
```

This maps the domain `vidcrop.com` to your local machine.

### 5. 📄 Apply Kubernetes YAML Configs
Check **secret.yaml.template** files and replace values like `<your-secret>` with actual secrets.

After this, from all of the 'manifests' directories, run:

```bash
kubectl apply -f .
```

### 6. 🛣️ Start Minikube Tunnel (in Separate Terminal)
In a new terminal, run:

```bash
minikube tunnel
```

This creates a route to services so they’re accessible via `localhost`.

✅ You should now be able to access your application at:  
**http://vidcrop.com/**
