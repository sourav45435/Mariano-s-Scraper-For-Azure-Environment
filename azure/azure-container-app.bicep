@description('Deployment location for Azure resources')
param location string = resourceGroup().location

@description('Azure Container Registry login server')
param acrServer string = 'marianoscr.azurecr.io'

@description('Image name with tag')
param imageName string = 'marianos-scraper:latest'

@description('Azure Storage Account Name for raw, staging, and production datasets')
param storageAccountName string = 'marianoscrawlstorage'

@description('Cron schedule: Twice weekly (Tuesdays and Fridays at 02:00 UTC)')
param cronSchedule string = '0 2 * * 2,5'

// Storage Account for JSON datasets
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
  }
}

// Blob Containers: staging, production, archive, quarantine
resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource stagingContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'staging'
}

resource productionContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'production'
}

resource archiveContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'archive'
}

resource quarantineContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'quarantine'
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'marianos-scraper-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Container Apps Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: 'marianos-env'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// Scheduled Azure Container Apps Job
resource scraperJob 'Microsoft.App/jobs@2023-05-01' = {
  name: 'marianos-twice-weekly-scraper'
  location: location
  properties: {
    environmentId: containerAppEnv.id
    configuration: {
      triggerType: 'Schedule'
      scheduleTriggerConfig: {
        cronExpression: cronSchedule
        parallelism: 1
        replicaCompletionCount: 1
      }
      replicaTimeout: 3600
      replicaRetryLimit: 3
    }
    template: {
      containers: [
        {
          name: 'marianos-scraper-runner'
          image: '${acrServer}/${imageName}'
          resources: {
            cpu: json('1.0')
            memory: '2.0Gi'
          }
          env: [
            {
              name: 'AZURE_STORAGE_ACCOUNT'
              value: storageAccount.name
            },
            {
              name: 'MIN_RECORD_THRESHOLD'
              value: '500'
            },
            {
              name: 'SCRAPER_MAX_RETRIES'
              value: '3'
            }
          ]
        }
      ]
    }
  }
}

output jobName string = scraperJob.name
output storageAccountId string = storageAccount.id
