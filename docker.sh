#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Microservices Docker Manager${NC}"
echo ""

case "$1" in
  start)
    echo -e "${YELLOW}Starting all services...${NC}"
    docker-compose up -d --build
    echo -e "${GREEN}✅ All services started!${NC}"
    echo -e "API Gateway: http://localhost:3000"
    ;;
    
  stop)
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker-compose down
    echo -e "${GREEN}✅ All services stopped!${NC}"
    ;;
    
  restart)
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker-compose restart
    echo -e "${GREEN}✅ All services restarted!${NC}"
    ;;
    
  logs)
    if [ -z "$2" ]; then
      docker-compose logs -f
    else
      docker-compose logs -f $2
    fi
    ;;
    
  status)
    docker-compose ps
    ;;
    
  clean)
    echo -e "${RED}⚠️  This will remove all containers and volumes!${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker-compose down -v
      echo -e "${GREEN}✅ Cleaned up!${NC}"
    fi
    ;;
    
  build)
    if [ -z "$2" ]; then
      echo -e "${YELLOW}Building all services...${NC}"
      docker-compose build --no-cache
    else
      echo -e "${YELLOW}Building $2...${NC}"
      docker-compose build --no-cache $2
    fi
    echo -e "${GREEN}✅ Build complete!${NC}"
    ;;
    
  *)
    echo "Usage: ./docker.sh {start|stop|restart|logs|status|clean|build} [service-name]"
    echo ""
    echo "Commands:"
    echo "  start       - Build and start all services"
    echo "  stop        - Stop all services"
    echo "  restart     - Restart all services"
    echo "  logs        - View logs (add service name for specific service)"
    echo "  status      - Show service status"
    echo "  clean       - Remove all containers and volumes"
    echo "  build       - Rebuild services (add service name for specific service)"
    echo ""
    echo "Services: user-service, product-service, order-service, api-gateway, mongodb"
    exit 1
    ;;
esac
