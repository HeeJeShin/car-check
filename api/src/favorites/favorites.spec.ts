import { BadRequestException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { PrismaService } from "../prisma/prisma.service";
import { FavoritesService, MAX_FAVORITES } from "./favorites.service";

function setup({ existing = false, carExists = true, count = 0 } = {}) {
  const favorite = {
    findUnique: vi.fn(async () => (existing ? { userId: 1, carModelId: 7 } : null)),
    count: vi.fn(async () => count),
    upsert: vi.fn(async () => ({})),
    deleteMany: vi.fn(async () => ({ count: 1 })),
  };
  const carModel = { findUnique: vi.fn(async () => (carExists ? { id: 7 } : null)) };
  return { favorite, service: new FavoritesService({ favorite, carModel } as unknown as PrismaService) };
}

describe("내 차량 담기", () => {
  it("이미 담긴 차는 다시 저장하지 않고 성공한다", async () => {
    const { service, favorite } = setup({ existing: true, count: MAX_FAVORITES });
    await expect(service.add(1, 7)).resolves.toBeUndefined();
    expect(favorite.upsert).not.toHaveBeenCalled();
  });

  it("없는 차종은 404", async () => {
    await expect(setup({ carExists: false }).service.add(1, 7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("한도를 넘으면 400", async () => {
    await expect(setup({ count: MAX_FAVORITES }).service.add(1, 7)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("지울 때는 내 목록의 그 차만 지운다", async () => {
    const { service, favorite } = setup();
    await service.remove(1, 7);
    expect(favorite.deleteMany).toHaveBeenCalledWith({ where: { userId: 1, carModelId: 7 } });
  });
});
