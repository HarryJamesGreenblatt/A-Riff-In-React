"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbPool = void 0;
const mssql_1 = __importDefault(require("mssql"));
const connectionString = process.env.AZURE_SQL_CONNECTIONSTRING;
if (!connectionString) {
    throw new Error('AZURE_SQL_CONNECTIONSTRING environment variable not set');
}
let pool;
const getDbPool = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!pool) {
        try {
            pool = yield mssql_1.default.connect(connectionString);
            console.log('Connected to SQL Server');
        }
        catch (err) {
            console.error('Database Connection Failed! Bad Config: ', err);
            throw err;
        }
    }
    return pool;
});
exports.getDbPool = getDbPool;
