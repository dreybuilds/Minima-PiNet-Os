import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

const baseDir = process.cwd();
const buildSystemDir = path.join(baseDir, 'build-system');

if (!fs.existsSync(buildSystemDir)) {
  fs.mkdirSync(buildSystemDir, { recursive: true });
}

const configDir = path.join(buildSystemDir, 'config');
const systemdDir = path.join(configDir, 'systemd');
const openboxDir = path.join(configDir, 'openbox');
const plymouthDir = path.join(configDir, 'plymouth');
const docsDir = path.join(buildSystemDir, 'docs');

[configDir, systemdDir, openboxDir, plymouthDir, docsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// --- 1. Systemd Services ---

const minimaService = `[Unit]
Description=Minima Blockchain Node
After=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/opt/minima
ExecStart=/usr/bin/java -jar /opt/minima/minima.jar -daemon -rpcenable
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;
fs.writeFileSync(path.join(systemdDir, 'minima.service'), minimaService);

const pinetDesktopService = `[Unit]
Description=PiNetOS Desktop Environment
After=systemd-user-sessions.service network.target sound.target
Conflicts=getty@tty1.service

[Service]
User=pi
Group=pi
PAMName=login
Environment=DISPLAY=:0
ExecStart=/usr/bin/startx /etc/X11/Xsession /opt/pinetos/app/pinetos-desktop -- :0 -nolisten tcp vt1
Restart=always
RestartSec=5

[Install]
WantedBy=graphical.target
`;
fs.writeFileSync(path.join(systemdDir, 'pinet-desktop.service'), pinetDesktopService);

const pinetNodeMonitorService = `[Unit]
Description=PiNetOS Node Monitor
After=minima.service

[Service]
Type=simple
User=pi
ExecStart=/usr/bin/node /opt/pinetos/scripts/node-monitor.js
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
`;
fs.writeFileSync(path.join(systemdDir, 'pinet-node-monitor.service'), pinetNodeMonitorService);

const pinetUpdateService = `[Unit]
Description=PiNetOS Auto Updater
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=root
ExecStart=/opt/pinetos/scripts/check-updates.sh
`;
fs.writeFileSync(path.join(systemdDir, 'pinet-update.service'), pinetUpdateService);

// --- 2. Openbox Autostart ---

const openboxAutostart = `# PiNetOS Autostart
xset s off
xset s noblank
xset -dpms

# Start PiNetOS Electron App
/opt/pinetos/app/pinetos-desktop --no-sandbox --kiosk &
`;
fs.writeFileSync(path.join(openboxDir, 'autostart'), openboxAutostart);

// --- 3. Plymouth Theme ---

const plymouthTheme = `[Plymouth Theme]
Name=PiNetOS
Description=PiNetOS Boot Splash
ModuleName=script

[script]
ImageDir=/usr/share/plymouth/themes/pinetos
ScriptFile=/usr/share/plymouth/themes/pinetos/pinetos.script
`;
fs.writeFileSync(path.join(plymouthDir, 'pinetos.plymouth'), plymouthTheme);

// --- 4. Build Scripts ---

const buildRootfsSh = `#!/bin/bash
set -e

echo "Building PiNetOS Root Filesystem..."

ROOTFS_DIR="rootfs"
ARCH="arm64"
RELEASE="bookworm"

if [ -d "$ROOTFS_DIR" ]; then
    sudo rm -rf "$ROOTFS_DIR"
fi

mkdir -p "$ROOTFS_DIR"

# 1. Base OS with debootstrap
sudo debootstrap --arch=$ARCH --foreign $RELEASE $ROOTFS_DIR http://deb.debian.org/debian/

# 2. Copy qemu-aarch64-static for chroot
sudo cp /usr/bin/qemu-aarch64-static $ROOTFS_DIR/usr/bin/

# 3. Second stage debootstrap
sudo chroot $ROOTFS_DIR /debootstrap/debootstrap --second-stage

# 4. Copy chroot setup script
sudo cp chroot-setup.sh $ROOTFS_DIR/
sudo cp -r config $ROOTFS_DIR/tmp/config

# 5. Run chroot setup
sudo chroot $ROOTFS_DIR /bin/bash /chroot-setup.sh

# 6. Cleanup
sudo rm $ROOTFS_DIR/chroot-setup.sh
sudo rm -rf $ROOTFS_DIR/tmp/config
sudo rm $ROOTFS_DIR/usr/bin/qemu-aarch64-static

echo "Root filesystem built successfully."
`;
fs.writeFileSync(path.join(buildSystemDir, 'build-rootfs.sh'), buildRootfsSh);
fs.chmodSync(path.join(buildSystemDir, 'build-rootfs.sh'), '755');

const chrootSetupSh = `#!/bin/bash
set -e

echo "Running chroot setup..."

# Set hostname
echo "pinetos" > /etc/hostname
echo "127.0.0.1 localhost pinetos" >> /etc/hosts

# Configure apt
cat <<EOF > /etc/apt/sources.list
deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware
EOF

apt-get update
apt-get install -y locales console-setup
echo "en_US.UTF-8 UTF-8" > /etc/locale.gen
locale-gen
export LC_ALL="en_US.UTF-8"

# Install essential packages
apt-get install -y \\
    sudo ssh network-manager curl wget git build-essential \\
    xserver-xorg xinit openbox lightdm plymouth plymouth-themes \\
    openjdk-17-jre-headless \\
    libnss3 libasound2 libatk-bridge2.0-0 libgtk-3-0 libdrm2 libgbm1 \\
    linux-image-arm64 linux-headers-arm64 firmware-linux-free firmware-brcm80211

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create pi user
useradd -m -s /bin/bash -G sudo,video,audio,plugdev,netdev pi
echo "pi:pinetos" | chpasswd
echo "pi ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers.d/010_pi-nopasswd

# Setup directories
mkdir -p /opt/pinetos/app
mkdir -p /opt/minima
mkdir -p /home/pi/pinet-data
mkdir -p /home/pi/pinet-wallet
mkdir -p /home/pi/.config/openbox
chown -R pi:pi /home/pi/pinet-data /home/pi/pinet-wallet /home/pi/.config

# Copy configs
cp /tmp/config/openbox/autostart /home/pi/.config/openbox/autostart
chown pi:pi /home/pi/.config/openbox/autostart

cp /tmp/config/systemd/*.service /etc/systemd/system/
systemctl enable minima.service
systemctl enable pinet-desktop.service
systemctl enable pinet-node-monitor.service
systemctl enable NetworkManager.service
systemctl enable ssh.service

# Setup Plymouth
mkdir -p /usr/share/plymouth/themes/pinetos
cp /tmp/config/plymouth/pinetos.plymouth /usr/share/plymouth/themes/pinetos/
plymouth-set-default-theme -R pinetos

echo "Chroot setup complete."
`;
fs.writeFileSync(path.join(buildSystemDir, 'chroot-setup.sh'), chrootSetupSh);
fs.chmodSync(path.join(buildSystemDir, 'chroot-setup.sh'), '755');

const buildImageSh = `#!/bin/bash
set -e

echo "Building PiNetOS Image..."

IMAGE_NAME="PiNetOS-RaspberryPi.img"
IMAGE_SIZE="4G"

# Create empty image file
fallocate -l $IMAGE_SIZE $IMAGE_NAME

# Partition the image (boot: 256MB FAT32, rootfs: remaining EXT4)
parted -s $IMAGE_NAME mklabel msdos
parted -s $IMAGE_NAME mkpart primary fat32 1MiB 256MiB
parted -s $IMAGE_NAME mkpart primary ext4 256MiB 100%

# Setup loop devices
LOOP_DEV=$(sudo losetup -fP --show $IMAGE_NAME)
BOOT_DEV="\${LOOP_DEV}p1"
ROOT_DEV="\${LOOP_DEV}p2"

# Format partitions
sudo mkfs.vfat -F 32 -n BOOT $BOOT_DEV
sudo mkfs.ext4 -L rootfs $ROOT_DEV

# Mount partitions
mkdir -p mnt/root
sudo mount $ROOT_DEV mnt/root
sudo mkdir -p mnt/root/boot
sudo mount $BOOT_DEV mnt/root/boot

# Copy rootfs
echo "Copying root filesystem..."
sudo cp -a rootfs/* mnt/root/

# Setup fstab
cat <<EOF | sudo tee mnt/root/etc/fstab
PARTUUID=$(sudo blkid -s PARTUUID -o value $ROOT_DEV)  /               ext4    defaults,noatime  0       1
PARTUUID=$(sudo blkid -s PARTUUID -o value $BOOT_DEV)  /boot           vfat    defaults          0       2
EOF

# Setup cmdline.txt
echo "console=serial0,115200 console=tty1 root=PARTUUID=$(sudo blkid -s PARTUUID -o value $ROOT_DEV) rootfstype=ext4 fsck.repair=yes rootwait quiet splash plymouth.ignore-serial-consoles" | sudo tee mnt/root/boot/cmdline.txt

# Unmount and cleanup
sudo umount mnt/root/boot
sudo umount mnt/root
sudo losetup -d $LOOP_DEV
rmdir mnt/root
rmdir mnt

echo "Image built successfully: $IMAGE_NAME"
`;
fs.writeFileSync(path.join(buildSystemDir, 'build-image.sh'), buildImageSh);
fs.chmodSync(path.join(buildSystemDir, 'build-image.sh'), '755');

const buildAllSh = `#!/bin/bash
set -e

echo "Starting PiNetOS Build Process..."

# 1. Build Electron App (assuming run from project root)
echo "Building Electron App for ARM64..."
cd ..
npm run electron:build -- --arm64 --linux tar.gz
cd build-system

# 2. Build Rootfs
./build-rootfs.sh

# 3. Copy Electron App to Rootfs
echo "Copying Electron App to rootfs..."
sudo mkdir -p rootfs/opt/pinetos/app
sudo tar -xzf ../dist-electron-build/PiNetOS-Desktop-*-arm64.tar.gz -C rootfs/opt/pinetos/app --strip-components=1

# 4. Build Image
./build-image.sh

echo "PiNetOS Build Complete!"
`;
fs.writeFileSync(path.join(buildSystemDir, 'build-all.sh'), buildAllSh);
fs.chmodSync(path.join(buildSystemDir, 'build-all.sh'), '755');

// --- 5. Documentation ---

const readmeMd = `# PiNetOS Build System

This directory contains the scripts required to build a bootable Raspberry Pi OS image for PiNetOS.

## Requirements
- A Linux host (Debian/Ubuntu recommended)
- \`debootstrap\`
- \`qemu-user-static\`
- \`parted\`
- \`dosfstools\`
- \`Node.js\` and \`npm\`

## Build Instructions

1. Install dependencies on your host:
   \`\`\`bash
   sudo apt-get install debootstrap qemu-user-static parted dosfstools
   \`\`\`

2. Run the master build script:
   \`\`\`bash
   sudo ./build-all.sh
   \`\`\`

This will:
1. Compile the PiNetOS Electron app for ARM64.
2. Build a Debian Bookworm ARM64 root filesystem.
3. Install Xorg, Openbox, Plymouth, and the Minima node.
4. Package everything into \`PiNetOS-RaspberryPi.img\`.
`;
fs.writeFileSync(path.join(docsDir, 'README.md'), readmeMd);

const flashingInstructionsMd = `# Flashing PiNetOS to an SD Card

Once you have the \`PiNetOS-RaspberryPi.img\` file, you can flash it to a MicroSD card to boot your Raspberry Pi.

## Using Raspberry Pi Imager (Recommended)

1. Download and install [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2. Open Raspberry Pi Imager.
3. Click **CHOOSE OS**.
4. Scroll down and select **Use custom**.
5. Select the \`PiNetOS-RaspberryPi.img\` file.
6. Click **CHOOSE STORAGE** and select your MicroSD card.
7. Click **WRITE**.
8. Once complete, insert the SD card into your Raspberry Pi and power it on.

## Using BalenaEtcher

1. Download and install [BalenaEtcher](https://balena.io/etcher/).
2. Open BalenaEtcher.
3. Click **Flash from file** and select \`PiNetOS-RaspberryPi.img\`.
4. Click **Select target** and choose your MicroSD card.
5. Click **Flash!**.
6. Once complete, insert the SD card into your Raspberry Pi and power it on.

## First Boot

On the first boot, PiNetOS will:
1. Display the custom Plymouth boot splash.
2. Start the X server and Openbox.
3. Automatically launch the PiNetOS Electron desktop in kiosk mode.
4. Start the Minima blockchain node in the background.
`;
fs.writeFileSync(path.join(docsDir, 'FLASHING_INSTRUCTIONS.md'), flashingInstructionsMd);

const architectureMd = `# PiNetOS Architecture

PiNetOS is a custom operating system designed for Raspberry Pi 4 and 5, built to run decentralized Web3 nodes and edge computing workloads.

## System Stack

1. **Hardware:** Raspberry Pi 4 / 5 (ARM64)
2. **Bootloader:** Raspberry Pi Firmware
3. **Kernel:** Linux Kernel (arm64)
4. **Init System:** systemd
5. **Display Server:** Xorg
6. **Window Manager:** Openbox
7. **Desktop Environment:** PiNetOS Electron App
8. **Blockchain Node:** Minima (Java)

## Key Components

- **Base OS:** Debian Bookworm ARM64. Chosen for stability and wide hardware support.
- **Root Filesystem:** Built using \`debootstrap\`.
- **Graphical Environment:** A minimal Xorg + Openbox setup is used instead of a full desktop environment (like PIXEL or GNOME) to save resources. The PiNetOS Electron app acts as the primary user interface.
- **Minima Node:** Runs as a systemd service (\`minima.service\`), ensuring it starts automatically and restarts on failure.
- **Persistent Storage:** User data and wallet keys are stored in \`~/pinet-data\` and \`~/pinet-wallet\`.
`;
fs.writeFileSync(path.join(docsDir, 'ARCHITECTURE.md'), architectureMd);

// --- 6. Zip the Build System and Documentation ---

const zipBuildSystem = new AdmZip();
zipBuildSystem.addLocalFolder(buildSystemDir);
zipBuildSystem.writeZip(path.join(baseDir, 'PiNetOS-Build-System.zip'));

const zipDocs = new AdmZip();
zipDocs.addLocalFolder(docsDir);
zipDocs.writeZip(path.join(baseDir, 'PiNetOS-Documentation.zip'));

console.log('Successfully created PiNetOS-Build-System.zip and PiNetOS-Documentation.zip');
