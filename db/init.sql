CREATE TABLE users (
    id UUID PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    current_pet_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    text TEXT,
    score INTEGER DEFAULT 0,
    type VARCHAR(50) NOT NULL,
    image_id JSONB,
    shopkeeper_data JSONB,
    breeder_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    item_type VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_inventory_user_id ON inventory(user_id); 