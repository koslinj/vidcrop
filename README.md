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

Then restart the WSL session:

```bash
exit  # close and reopen terminal
```

Test again:

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
