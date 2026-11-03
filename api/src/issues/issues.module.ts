import { Module } from "@nestjs/common";
import { IssuesController } from "./issues.controller";
import { IssuesService } from "./issues.service";
import { ReportsService } from "./reports.service";

@Module({
  controllers: [IssuesController],
  providers: [IssuesService, ReportsService],
})
export class IssuesModule {}
