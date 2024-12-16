export class Item {
  constructor(image) {
    this.image = image;
  }

  use = (context) => {
    console.log('Item used');
  }

}

export class Pet extends Item {
  constructor(image) {
    super(image);
    this.badges = [];
  }

  use = () => {
    setImageId(this.image);
    setInventory(inventory.filter((_, i) => i !== index));
  }

  addBadge = (badge) => {
    console.log('Badge added' + badge.image);

    console.log('Current BadgeImages: ');
    this.badges.map(b => {console.log(b.image);})

          const badgeIndex = this.badges.findIndex((b) => b.image === badge.image);
    if (badgeIndex !== -1) {
      this.badges[badgeIndex].count++;
    } else {
      this.badges.push({ ...badge, count: 1 });
    }
  }

  badgeCheck = () => {
    return this.badges.length < 3;
  }
}

export class Badge {
  constructor(data) {
    if (typeof data === 'string') {
      // Handle legacy string constructor
      this.type = 'badge';
      this.name = data;
      this.image = data;
      this.count = 1;
    } else {
      // Handle object constructor
      this.type = data.type || 'badge';
      this.name = data.name || data.image;
      this.image = data.image;
      this.count = data.count || 1;
    }
  }

  use({ imageId, index, setInventory, inventory }) {
    if (imageId.badgeCheck()) {
      imageId.addBadge(this);
      setInventory(inventory.filter((_, i) => i !== index));
    }
  }
}
