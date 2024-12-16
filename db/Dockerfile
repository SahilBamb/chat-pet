FROM postgres:15

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/

# Set basic environment variables
ENV POSTGRES_DB=chatpet
ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=password 